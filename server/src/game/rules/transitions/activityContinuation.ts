import { getActionDefinition } from "@server/game/cards/registry";
import type { IAccessor, IDecisions } from "@server/game/types";
import type { ActivityData, ActivityTypeMap, Decision } from "@server/types";
import { createActionChoice } from "./choices";

/******************************************************************************
 * ### Activity Continuation Logic
 *
 * If an activity requires more than one choice, it will need to be
 * "continued". Co-located with transitions since they manage activity flow.
 ******************************************************************************/
export const activityTypeContinuedActivity: ActivityTypeMap<
  (args: {
    accessor: IAccessor;
    currentActivity: ActivityData;
    currentDecisions: IDecisions;
  }) => ActivityData
> = {
  drawingCards: ({ currentActivity }) => {
    throw new Error(
      `'${currentActivity.type}' activities must only have one choice`,
    );
  },
  choosingAction: ({ currentActivity }) => {
    throw new Error(
      `'${currentActivity.type}' activities must only have one choice`,
    );
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Continuing taking an action is a matter of taking the next choice and
   * making it the current choice.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  takingAction: ({ accessor, currentActivity, currentDecisions }) => {
    if (currentActivity.type !== "takingAction") {
      throw new Error(
        `Expected a 'takingAction' activity type, found '${currentActivity.type}.'`,
      );
    }
    if (currentActivity.nextChoices.length < 1) {
      throw new Error(`Cannot continue an activity with no remaining choices.`);
    }
    const next: ActivityData = {
      ...currentActivity,
      nextChoices: currentActivity.nextChoices.slice(1),
      previousDecisions: currentDecisions.decisions as Decision[], // boo...
    };
    const nextChoice = currentActivity.nextChoices[0];
    const action = accessor.getActionById({
      actionId: currentActivity.actionId,
    });
    const actionDef = getActionDefinition({
      cardName: action.card.name,
      actionType: action.type,
    });
    const choiceDef = actionDef.sequence?.choices[nextChoice.index];
    if (!choiceDef) {
      throw new Error(
        `No choice for action '${action.id}' at index ${nextChoice.index}`,
      );
    }
    next.currentChoice = createActionChoice({
      choiceDef,
      accessor: accessor,
      currentDecisions,
      actionContext: {
        cardId: action.card.id,
        playerTakingActionId: nextChoice.playerId,
      },
    });
    return next;
  },
};
