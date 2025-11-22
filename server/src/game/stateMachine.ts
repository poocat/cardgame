import {
  activityTypeContinuedActivity,
  activityTypeEffects,
  activityTypeNextActivity,
  activityTypeTriggeredEffects,
  triggeredEffects,
} from "@server/game/rules";
import { Accessor, Decisions, Next } from "@server/game/runtime";
import { logger } from "@server/logger";
import type { Decision, GameData } from "@server/types";

/******************************************************************************
 * ### Main Game "Loop"
 *
 * At all times the game is waiting for a single player to make a "choice" for
 * the current "activity".
 *
 * A combination of the current game data and the last choice made are used to
 * affect the game data and prompt the next choice.
 ******************************************************************************/
export function makeDecision(args: {
  gameData: GameData;
  decision: Decision;
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

  const playerTakingTurn = currentAccessor.getPlayerTakingTurn();

  // Initialize object that will track all the changes that will need to be made
  // to the game data.
  const next = new Next(args.gameData);

  if (currentActivity.nextChoices.length > 0) {
    // If the current activity needs more choices to be made, continue the activity.
    next.mutatorQueue.setActivity({
      activity: activityTypeContinuedActivity[currentActivity.type]({
        accessor: currentAccessor,
        currentActivity,
        currentDecisions,
      }),
    });
    next.dequeueMutations();
  } else {
    // Otherwise, use the decisions made to affect the game data.
    let loopCount = 0;
    do {
      if (loopCount++ >= 10) {
        // Canary in a coal mine...
        logger.error(
          { loopCount, decision: args.decision },
          "state machine loop limit",
        );
        throw new Error(
          `State machine looped too many times (${loopCount}) on a single decision: ${JSON.stringify(args.decision)}`,
        );
      }
      logger.debug(
        { loopCount, activityType: currentActivity.type },
        "state machine loop",
      );
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
      currentDecisions = new Decisions([]);

      logger.info(
        {
          previousActivityType,
          newActivity: currentActivity.type,
          playerId: args.decision.playerId,
        },
        "activity transitioned",
      );

      // If the next activity has no choices to be made, repeat the process with
      // the updated game data, activity, decisions.
    } while (currentActivity.currentChoice.max === 0);
  }
  return next.finish();
}
