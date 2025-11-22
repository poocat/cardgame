import { getActionDefinition } from "@server/game/cards/utils";
import type {
  ActionContext,
  IAccessor,
  IDecisions,
  IMutator,
} from "@server/game/types";
import type { ActivityData, ActivityTypeMap } from "@server/types";
import { actionTypeDefaultEffects } from "./actionEffects";

/******************************************************************************
 * ### Activity Execution Effects
 *
 * Effects that occur when an activity completes, based on activity type.
 * Co-located with action effects since they're applied in the same game loop phase.
 ******************************************************************************/
export const activityTypeEffects: ActivityTypeMap<
  (args: {
    accessor: IAccessor;
    currentActivity: ActivityData;
    currentDecisions: IDecisions;
    mutator: IMutator;
  }) => void
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * The effect of drawing cards is just moving cards from "in deck" to
   * "in hand".
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  drawingCards: ({ currentDecisions, mutator }) => {
    const cardId = currentDecisions.decisions[0].values[0];
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
  takingAction: ({ accessor, currentActivity, currentDecisions, mutator }) => {
    if (!(currentActivity.type === "takingAction")) {
      // Should never get here, but necessary for typescript to believe that
      // `actionId` is in `currentActivity`.
      throw new Error(
        `Expected 'takingAction' activity, found '${currentActivity.type}'`,
      );
    }
    const action = accessor.getActionById({
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
      accessor,
      context: actionContext,
      decisions: currentDecisions,
      mutator,
    });
    // Apply default effects per action type.
    actionTypeDefaultEffects[action.type]({ context: actionContext, mutator });
  },
};
