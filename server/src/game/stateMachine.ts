import { Decision, GameData } from "@common/types";
import {
  activityChangeEffects,
  activityTypeEffects,
  activityTypeTriggeredEffects,
  continueActivity,
  createNextActivity,
} from "@server/game/rules/activities";
import { GameState, Next } from "@server/game/utils";

/******************************************************************************
 * ### Main Game "Loop"
 *
 * At all times the game is waiting for a single player to make a "choice" for
 * the current "activity".
 *
 * A combination of the current game state/data and the last choice made are
 * used to affect the game state and prompt the next choice.
 ******************************************************************************/
export function makeDecision(args: {
  gameData: GameData;
  decision: Decision;
}): GameData {
  // Validate the decision.
  if (args.gameData.activity.currentChoice.min > args.decision.values.length) {
    throw new Error(`Invalid decision for current choice: ${args.decision}`);
  }

  let currentGameState = new GameState(args.gameData);
  let currentActivity = args.gameData.activity;
  let currentDecisions = [...currentActivity.previousDecisions, args.decision];

  const playerTakingTurn = currentGameState.getPlayerTakingTurn();

  // Initialize object that will track all the changes that will need to be made
  // to the game state.
  const next = new Next(args.gameData);

  if (currentActivity.nextChoices.length > 0) {
    // If the current activity needs more choices to be made, continue the activity.
    next.mutatorQueue.setActivity({
      activity: continueActivity[currentActivity.type]({
        gameState: currentGameState,
        currentActivity,
        currentDecisions,
      }),
    });
    next.dequeueMutations();
  } else {
    // Otherwise, use the decisions made to affect the game state.
    do {
      // Apply all the effects for the decisions made for this activity.
      activityTypeEffects[currentActivity.type]({
        gameState: currentGameState,
        currentActivity: currentActivity,
        currentDecisions,
        mutator: next.mutatorQueue,
      });
      let nextGameState = next.dequeueMutations();
      // Fire triggers for this activity, based on changes to the game state.
      activityTypeTriggeredEffects[currentActivity.type]({
        current: currentGameState,
        next: nextGameState,
        mutator: next.mutatorQueue,
      });
      nextGameState = next.dequeueMutations();
      // Generate and apply the next activity using the updated game state.
      const nextActivity = createNextActivity[currentActivity.type]({
        playerData: playerTakingTurn,
        gameState: nextGameState,
        currentDecisions,
      });
      activityChangeEffects({
        nextActivity,
        playerTakingTurn,
        mutator: next.mutatorQueue,
      });
      currentGameState = next.dequeueMutations();
      // If the next activity has no choices to be made, repeat the process with
      // the updated game state, activity, decisions.
      currentActivity = nextActivity;
      currentDecisions = [];
    } while (next.activityIsInstantaneous());
  }
  return next.finish();
}
