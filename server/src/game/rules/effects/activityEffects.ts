import { getActionDefinition } from "@server/game/cards/registry";
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
 * Co-located with action effects since they're applied in the same game loop
 * phase.
 *
 * Note, for "takingAction" type activities, includes automatic effects such as
 * moving cards into or out of play for "play" and "discard" type actions.
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
   * The effect of drawing cards is just moving the top card from the chosen
   * deck into the player's hand.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  drawingCards: ({ accessor, currentDecisions, mutator }) => {
    const decision = currentDecisions.decisions[0];
    const type = decision.values[0];
    if (type === "producer" || type === "consumer") {
      accessor
        .getCards({
          playerIds: [decision.playerId],
          types: [type],
          locationTypes: ["inDeck"],
        })
        .slice(0, 1)
        .forEach((c) => {
          mutator.moveCard({ id: c.id, location: { type: "inHand" } });
        });
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
    if (!actionDef.skipDefaultEffects) {
      actionTypeDefaultEffects[action.type]({
        context: actionContext,
        mutator,
      });
    }
  },
};
