import { CONSTANTS } from "@common/game/constants";
import { getActionDefinition } from "@server/game/cards/registry";
import type {
  ActionContext,
  ChoiceDef,
  IAccessor,
  IAnnotator,
  IDecisions,
} from "@server/game/types";
import type {
  ActionData,
  ActivityData,
  ChoiceData,
  Id,
  NextChoiceData,
  PlayerData,
} from "@server/types";
import { actionTypeChecks } from "../checks/actionChecks";

/******************************************************************************
 * ### cycleTofront
 *
 * A utility for rotating an array in place until the element found by the
 * given match function is at the beginning.
 *
 * If no element is found, the array is untouched.
 ******************************************************************************/
function cycleToFront<T>(array: T[], match: (item: T) => boolean) {
  const matchIndex = array.findIndex(match);
  if (matchIndex === -1) return;
  for (let i = 0; i !== matchIndex; i++) {
    const item = array.shift();
    if (item) array.push(item);
  }
}

/******************************************************************************
 * Use to generate a "null choice", which signals to the state machine that the
 * game data should be passed back through the state machine. Most relevant
 * when an action has no choices.
 *
 * Note, any choice that has a `max` value of 0 will be interpreted as a "null
 * choice".
 ******************************************************************************/
export function nullChoice(): ChoiceData {
  return {
    name: "",
    type: "arbitrary",
    choosingPlayerId: "",
    instructions: "",
    values: [],
    min: 0,
    max: 0,
  };
}

/******************************************************************************
 * Feeds the current game data, and all the currently made decisions, into the
 * callbacks defined for the relevant card, to yield a series of choices for
 * the given choice definition.
 *
 * Multiple choices might be generated if the choice definition yields multiple
 * choosing players, in which case, the choice is duplicated amongst those
 * players.
 *
 * Zero choices might be generated if the choice definition yields no viable
 * choosing players.
 ******************************************************************************/
export function createActionChoice(args: {
  choiceDef: ChoiceDef;
  accessor: IAccessor;
  currentDecisions: IDecisions;
  actionContext: ActionContext;
}): ChoiceData {
  const commonArgs = {
    accessor: args.accessor,
    currentDecisions: args.currentDecisions,
    context: {
      ...args.actionContext,
      choosingPlayerId: args.actionContext.playerTakingActionId,
    },
  };
  const values = args.choiceDef.getValues(commonArgs);
  const min =
    args.choiceDef.min ??
    args.choiceDef.getMin?.({ ...commonArgs, values }) ??
    0;
  const max =
    args.choiceDef.max ??
    args.choiceDef.getMax?.({ ...commonArgs, values }) ??
    9999;
  return {
    name: args.choiceDef.name,
    type: args.choiceDef.type,
    min,
    max,
    choosingPlayerId: args.actionContext.playerTakingActionId,
    instructions: args.choiceDef.instructions,
    values,
  };
}

/******************************************************************************
 * Generates the single choice for the "drawingCards" activity.
 ******************************************************************************/
export function createDrawingCardsChoice(args: {
  playerId: Id;
  accessor: IAccessor;
}): ChoiceData {
  const values = [];
  const cardsInHand = args.accessor.getCards({
    playerIds: [args.playerId],
    locationTypes: ["inHand"],
  });
  if (cardsInHand.length < CONSTANTS.maxNumCardsInHand) {
    const consumers = args.accessor.getCards({
      playerIds: [args.playerId],
      types: ["consumer"],
      locationTypes: ["inDeck"],
    });
    const producers = args.accessor.getCards({
      playerIds: [args.playerId],
      types: ["producer"],
      locationTypes: ["inDeck"],
    });
    // TODO!!! "Producer" and "consumer" are generic terms. Allow themed terminology.
    if (producers.length > 0) values.push("producer");
    if (consumers.length > 0) values.push("consumer");
  }
  return {
    name: "deck",
    type: "arbitrary",
    choosingPlayerId: args.playerId,
    instructions: "Choose a card to draw.",
    values,
    min: values.length > 0 ? 1 : 0,
    max: 1,
  };
}

/******************************************************************************
 * Generates the single choice for the "choosingAction" activity.
 ******************************************************************************/
export function createChoosingActionChoice(args: {
  playerId: Id;
  accessor: IAccessor;
  annotator?: IAnnotator;
}): ChoiceData {
  // Filter through actions.
  const values = args.accessor
    .getVisibleActions({ playerId: args.playerId })
    .filter((a) => {
      // Cannot take an action from another player's card.
      if (a.card.ownerId !== args.playerId) {
        args.annotator?.add({
          id: a.id,
          messages: ["This is not your card."],
        });
        return false;
      }

      const typeCheckResult = actionTypeChecks[a.type]({
        actionData: a,
        accessor: args.accessor,
      });
      if (!typeCheckResult.ok) {
        args.annotator?.add({ id: a.id, messages: typeCheckResult.reasons });
        return false;
      }
      const actionDef = getActionDefinition({
        cardName: a.card.name,
        actionType: a.type,
      });
      const sequenceCheck = actionDef.sequence?.check;
      if (sequenceCheck) {
        const result = sequenceCheck({
          accessor: args.accessor,
          context: { cardId: a.card.id, playerTakingActionId: args.playerId },
        });
        if (!result.ok) {
          args.annotator?.add({ id: a.id, messages: result.reasons });
          return false;
        }
      }
      return true;
    })
    .map((a) => a.id);
  return {
    name: "actionToTake",
    type: "actionId",
    choosingPlayerId: args.playerId,
    instructions: "Choose an action to take, or pass your turn.",
    values,
    min: 0,
    max: 1,
  };
}

/******************************************************************************
 * Generates choices for a "takingAction" activity.
 *
 * If returns an empty array, then no viable choosing players could be found.
 * Ideally this wouldn't happen, as it implies that the action is not possible
 * given the current game data...
 ******************************************************************************/
export function createTakingActionChoices(args: {
  playerData: PlayerData;
  accessor: IAccessor;
  actionData: ActionData;
  decisions: IDecisions;
}): Pick<ActivityData, "currentChoice" | "nextChoices"> {
  const actionDef = getActionDefinition({
    cardName: args.actionData.card.name,
    actionType: args.actionData.type,
  });
  const choices = actionDef.sequence?.choices ?? [];
  if (choices.length < 1) {
    // Not all actions have choices (e.g. "play" or "discard" type actions).
    // In those cases, send a special choice to signal the state machine.
    return { currentChoice: nullChoice(), nextChoices: [] };
  }
  // A sequence can be repeated amongst multiple players.
  const eligiblePlayers: PlayerData[] = [];
  if (actionDef.sequence?.getPlayers) {
    eligiblePlayers.push(
      ...actionDef.sequence.getPlayers({
        accessor: args.accessor,
        context: {
          cardId: args.actionData.card.id,
          playerTakingActionId: args.playerData.id,
        },
      }),
    );
    cycleToFront(eligiblePlayers, (player) => player.id === args.playerData.id);
  } else {
    eligiblePlayers.push(args.playerData);
  }
  if (eligiblePlayers.length < 1) {
    // If no players eligible, move on.
    return { currentChoice: nullChoice(), nextChoices: [] };
  }
  const firstChoiceDef = choices[0];
  const firstPlayer = eligiblePlayers[0];
  const firstChoice = createActionChoice({
    choiceDef: firstChoiceDef,
    accessor: args.accessor,
    currentDecisions: args.decisions,
    actionContext: {
      cardId: args.actionData.card.id,
      playerTakingActionId: firstPlayer.id,
    },
  });
  const nextChoices: NextChoiceData[] = eligiblePlayers
    .flatMap((player) =>
      choices.map((_, i) => ({
        index: i,
        playerId: player.id,
      })),
    )
    .slice(1);
  return { currentChoice: firstChoice, nextChoices };
}
