import {
  activityTypeContinuedActivity,
  activityTypeEffects,
  activityTypeNextActivity,
  activityTypeTriggeredEffects,
  triggeredEffects,
} from "@server/game/rules";
import { Accessor, Decisions, Next } from "@server/game/runtime";
import type { IAccessor } from "@server/game/types";
import { getWinners } from "@server/game/winConditions";
import { logger } from "@server/logger";
import type {
  ActivityData,
  ChipLocationType,
  Decision,
  GameData,
  Id,
} from "@server/types";

/******************************************************************************
 * ### getAutoDecisions
 *
 * Examines an activity for whether or not any decisions can be made
 * automatically, i.e. a specific number of psyche need to be chosen from a
 * single pool.
 ******************************************************************************/
function getAutoDecisions(args: {
  currentAccessor: IAccessor;
  currentActivity: ActivityData;
}): Decision[] {
  const choice = args.currentActivity.currentChoice;
  if (choice.type === "chipId" && choice.min === choice.max) {
    const chipIds = choice.values;
    const seenLocationTypes: Set<ChipLocationType> = new Set();
    const seenCardIds: Set<Id> = new Set();
    for (const chip of args.currentAccessor.chips) {
      if (chipIds.includes(chip.id)) {
        seenLocationTypes.add(chip.location.type);
        if (chip.location.type === "onCard") {
          seenCardIds.add(chip.location.cardId);
        }
        // All chips must be in the same pool to qualify for auto decision.
        if (seenLocationTypes.size > 1 || seenCardIds.size > 1) {
          return [];
        }
      }
    }
    return [
      {
        name: choice.name,
        playerId: choice.choosingPlayerId,
        values: choice.values.slice(0, choice.min),
      },
    ];
  }
  return [];
}

/******************************************************************************
 * ### decisionIssues
 *
 * Validation of the decision passed to the state machine. Returns an array
 * of issues. If there aren't any, then the decision is valid.
 ******************************************************************************/
function decisionIssues(args: {
  gameData: GameData;
  decision: Decision;
}): string[] {
  const issues: string[] = [];
  if (args.gameData.activity.currentChoice.min > args.decision.values.length) {
    issues.push("not enough values");
  } else if (
    args.gameData.activity.currentChoice.max &&
    args.gameData.activity.currentChoice.max < args.decision.values.length
  ) {
    issues.push("too many values");
  }
  if (
    args.gameData.activity.currentChoice.choosingPlayerId !==
    args.decision.playerId
  ) {
    issues.push("wrong player");
  }
  if (
    args.decision.values.some(
      (v) => !args.gameData.activity.currentChoice.values.includes(v),
    )
  ) {
    const diff = args.decision.values.filter(
      (v) => !args.gameData.activity.currentChoice.values.includes(v),
    );
    issues.push(`values not part of the choice (${diff})`);
  }
  return issues;
}

/******************************************************************************
 * ### makeDecision
 *
 * Comprises the main Game "Loop".
 *
 * At all times the game is waiting for a single player to make a "choice" for
 * the current "activity".
 *
 * A combination of the current game data and the last choice made are used to
 * affect the game data and prompt the next choice.
 *
 * This function can loop through multiple "choices":
 * - When an activity concludes, and the next activity has no choices (i.e. a
 *   "takingAction" activity for a "play" action with no side effects), the
 *   state machine will continue to cycle through activities until a choice
 *   needs to be made.
 * - When the next choice can be made "automatically" (i.e. an exact number of
 *   chips need to be chosen from a single pool), the state machine will
 *   continue to cycle through choices until one must be made by the player.
 ******************************************************************************/
export function makeDecision(args: {
  gameData: GameData;
  decision: Decision;
  autoDecide?: boolean;
}): GameData {
  logger.debug(
    {
      activityType: args.gameData.activity.type,
      decisionName: args.decision.name,
      playerId: args.decision.playerId,
    },
    "processing decision",
  );

  // Validate the decision.
  const issues = decisionIssues({
    gameData: args.gameData,
    decision: args.decision,
  });
  if (issues.length > 0) {
    const errorMessage = `invalid decision: ${issues}`;
    logger.error(
      {
        decision: args.decision,
        currentChoice: args.gameData.activity.currentChoice,
      },
      errorMessage,
    );
    throw new Error(errorMessage);
  }

  let currentActivity = args.gameData.activity;
  let currentAccessor = new Accessor(args.gameData);
  let currentDecisions = new Decisions([
    ...currentActivity.previousDecisions,
    args.decision,
  ]);
  let currentAutoDecisions: Decision[] = [];

  const playerTakingTurn = currentAccessor.getPlayerTakingTurn();

  // Initialize object that will track all the changes that will need to be made
  // to the game data.
  const next = new Next(args.gameData);

  let decisionLoopCount = 0;
  do {
    if (currentActivity.nextChoices.length > 0) {
      // If the current activity needs more choices to be made, continue the activity.
      next.mutatorQueue.setActivity({
        activity: activityTypeContinuedActivity[currentActivity.type]({
          accessor: currentAccessor,
          currentActivity,
          currentDecisions,
        }),
      });
      currentAccessor = next.dequeueMutations();
      currentActivity = next.activity;
      if (args.autoDecide)
        currentAutoDecisions = getAutoDecisions({
          currentAccessor,
          currentActivity,
        });
      currentDecisions = new Decisions([
        ...currentDecisions.getDecisions(),
        ...currentAutoDecisions,
      ]);
    } else {
      // Otherwise, use the decisions made to affect the game data.
      let activityLoopCount = 0;
      do {
        // Apply all the effects for the decisions made for this activity.
        activityTypeEffects[currentActivity.type]({
          accessor: currentAccessor,
          currentActivity: currentActivity,
          currentDecisions,
          mutator: next.mutatorQueue,
          // logger: logger, // Something to think about...
        });
        let nextAccessor = next.dequeueMutations();
        // Fire triggers for this activity, based on changes to the game data.
        activityTypeTriggeredEffects[currentActivity.type]({
          current: currentAccessor,
          next: nextAccessor,
          mutator: next.mutatorQueue,
        });
        nextAccessor = next.dequeueMutations();
        // Look for any custom triggers on cards in play and fire.
        triggeredEffects({
          current: currentAccessor,
          next: nextAccessor,
          mutator: next.mutatorQueue,
        });
        nextAccessor = next.dequeueMutations();
        // Generate and apply the next activity using the updated game data.
        activityTypeNextActivity[currentActivity.type]({
          playerData: playerTakingTurn,
          accessor: nextAccessor,
          currentDecisions,
          mutator: next.mutatorQueue,
          annotator: next.annotator,
        });
        /**
         * TODO!!!
         * It's possible for the activity to stick a player with an impossible
         * choice, e.g. when the minimum required number of values is greater than
         * the number of values available. Need to figure out how to catch this
         * and roll back.
         */
        const previousActivityType = currentActivity.type;
        currentAccessor = next.dequeueMutations();
        currentActivity = next.activity;
        if (args.autoDecide)
          currentAutoDecisions = getAutoDecisions({
            currentAccessor,
            currentActivity,
          });
        currentDecisions = new Decisions([
          ...currentDecisions.getDecisions(),
          ...currentAutoDecisions,
        ]);

        logger.info(
          {
            previousActivityType,
            newActivityType: currentActivity.type,
            playerId: args.decision.playerId,
          },
          "activity transitioned",
        );

        if (activityLoopCount++ >= 10) {
          // Canary in a coal mine...
          logger.error(
            { activityLoopCount, decision: args.decision },
            "state machine loop limit",
          );
          throw new Error(
            `State machine looped too many times (${activityLoopCount}) on a single decision: ${JSON.stringify(args.decision)}`,
          );
        }
        // If the next activity has no choices to be made, or can be made
        // automatically, repeat the process with the updated game data, activity,
        // decisions.
      } while (currentActivity.currentChoice.max === 0);
    }
    if (decisionLoopCount++ >= 10) {
      logger.error(
        { decisionLoopCount, decision: args.decision },
        "reached state machine loop limit",
      );
      throw new Error(
        `State machine looped too many times (${decisionLoopCount}) on a single decision: ${JSON.stringify(args.decision)}`,
      );
    }
    // If the next choice was made automatically, move to the next choice.
  } while (currentAutoDecisions.length > 0);

  // Finally, check for any winners, and log them in game data.
  getWinners(currentAccessor).forEach((p) => {
    next.mutatorQueue.addWin({ playerId: p.id });
  });
  next.dequeueMutations();

  return next.finish();
}
