import { Decision, GameData } from "@server/types";
import {
  activityTypeContinuedActivity,
  activityTypeEffects,
  activityTypeNextActivity,
  activityTypeTriggeredEffects,
} from "@server/game/rules/activities";
import { Accessor, Next } from "@server/game/runtime";
import { triggeredEffects } from "@server/game/rules/cards/triggeredEffects";

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
  // Validate the decision.
  if (args.gameData.activity.currentChoice.min > args.decision.values.length) {
    throw new Error(
      `Invalid decision for current choice; not enough values: ${JSON.stringify(args.decision)}`,
    );
  }
  if (
    args.gameData.activity.currentChoice.choosingPlayerId !==
    args.decision.playerId
  ) {
    throw new Error(
      `Invalid decision for current choice; wrong player: ${args.decision.playerId}`,
    );
  }
  if (
    args.decision.values.some(
      (v) => !args.gameData.activity.currentChoice.values.includes(v),
    )
  ) {
    const diff = args.decision.values.filter(
      (v) => !args.gameData.activity.currentChoice.values.includes(v),
    );
    throw new Error(
      `Invalid value(s) for current choice; decision includes values that were not part of the choice: ${diff}`,
    );
  }

  let currentAccessor = new Accessor(args.gameData);
  let currentActivity = args.gameData.activity;
  let currentDecisions = [...currentActivity.previousDecisions, args.decision];

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
        throw new Error(
          `State machine looped too many times (${loopCount}) on a single decision: ${JSON.stringify(args.decision)}`,
        );
      }
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
      currentAccessor = next.dequeueMutations();
      currentActivity = next.activity;
      currentDecisions = [];
      // If the next activity has no choices to be made, repeat the process with
      // the updated game data, activity, decisions.
    } while (currentActivity.currentChoice.max === 0);
  }
  return next.finish();
}
