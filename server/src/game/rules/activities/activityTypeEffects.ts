import { ActivityData, ActivityTypeMap, Decision } from "@common/game/types";
import { getActionDefinition } from "@server/game/cards/utils";
import { actionTypeDefaultEffects } from "@server/game/rules/actions";
import { Decisions } from "@server/game/utils/Decisions";
import { GameState } from "@server/game/utils/GameState";
import { ActionContext, IMutator } from "@server/game/types";

/******************************************************************************
 * ### Automatic Effects by Activity Type
 *
 * Effects that come about from completing an activity of the given type.
 ******************************************************************************/
export const activityTypeEffects: ActivityTypeMap<
  (args: {
    gameState: GameState;
    currentActivity: ActivityData;
    currentDecisions: Decision[];
    mutator: IMutator;
  }) => void
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * The effect of drawing cards is just moving cards from "in deck" to
   * "in hand".
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  drawingCards: ({ currentDecisions, mutator }) => {
    const cardId = currentDecisions[0].values[0];
    // Not guaranteed to have a card in deck at the draw step.
    if (cardId) {
      mutator.moveCard({ id: cardId, location: { type: "inHand" } });
    }
  },

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * There are no effects that come from choosing an action.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  choosingAction: () => {},

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * The effects from taking an action come mostly from the definition of the
   * action on its card. There are also some default effects for different
   * types of cards.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  takingAction: ({ gameState, currentActivity, currentDecisions, mutator }) => {
    if (!(currentActivity.type === "takingAction")) {
      // Should never get here, but necessary for typescript to believe that
      // `actionId` is in `currentActivity`.
      throw new Error(
        `Expected 'takingAction' activity, found '${currentActivity.type}'`,
      );
    }
    const action = gameState.getActionById({
      actionId: currentActivity.actionId,
    });
    const actionContext: ActionContext = {
      cardId: action.card.id,
      playerTakingActionId: currentActivity.playerTakingActionId,
    };
    const actionDef = getActionDefinition({
      cardName: action.card.name,
      actionType: action.type,
    });
    actionDef.sequence?.affect({
      gameState,
      context: actionContext,
      decisions: new Decisions(currentDecisions),
      mutator,
    });
    // Apply default effects per action type.
    actionTypeDefaultEffects[action.type]({ context: actionContext, mutator });
  },
};
