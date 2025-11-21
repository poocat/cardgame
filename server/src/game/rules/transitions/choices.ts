import {
  ActionData,
  ActivityData,
  ChoiceData,
  Id,
  NextChoiceData,
  PlayerData,
} from "@server/types";
import { getActionDefinition } from "@server/game/cards/utils";
import { actionTypeChecks } from "../checks/actionChecks";
import {
  ActionContext,
  ChoiceDef,
  IAccessor,
  IDecisions,
} from "@server/game/types";

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
export function createActionChoices(args: {
  choiceDef: ChoiceDef;
  accessor: IAccessor;
  currentDecisions: IDecisions;
  actionContext: ActionContext;
}): ChoiceData[] {
  const choosingPlayerIds: Id[] = [];
  if (!args.choiceDef.getChoosingPlayers) {
    // By default, the choosing player is the one taking the action.
    choosingPlayerIds.push(args.actionContext.playerTakingActionId);
  } else {
    choosingPlayerIds.push(
      ...args.choiceDef.getChoosingPlayers({
        accessor: args.accessor,
        currentDecisions: args.currentDecisions,
        context: args.actionContext,
      }),
    );
  }
  return choosingPlayerIds.map((playerId) => {
    const values = args.choiceDef.getValues({
      accessor: args.accessor,
      currentDecisions: args.currentDecisions,
      context: { ...args.actionContext, choosingPlayerId: playerId },
    });
    return {
      name: args.choiceDef.name,
      type: args.choiceDef.type,
      min: args.choiceDef.min,
      max: args.choiceDef.max,
      choosingPlayerId: playerId,
      instructions: args.choiceDef.instructions,
      values,
    };
  });
}

/******************************************************************************
 * Generates the single choice for the "drawingCards" activity.
 ******************************************************************************/
export function createDrawingCardsChoice(args: {
  playerId: Id;
  accessor: IAccessor;
}): ChoiceData {
  const values = args.accessor
    .getCards({ playerIds: [args.playerId], locationTypes: ["inDeck"] })
    .slice(0, 1)
    .map((c) => c.id);
  return {
    name: "cardsToDraw",
    type: "cardId",
    choosingPlayerId: args.playerId,
    instructions: "Choose a card to draw.",
    values,
    // If nothing left in the deck, allow zero choices.
    min: Math.min(values.length, 1),
    max: 1,
  };
}

/******************************************************************************
 * Generates the single choice for the "choosingAction" activity.
 ******************************************************************************/
export function createChoosingActionChoice(args: {
  playerId: Id;
  accessor: IAccessor;
}): ChoiceData {
  // Filtering through every action seems dumb, but...
  const values = args.accessor.actions
    .filter((a) => {
      // Cannot take an action from another player's card.
      if (a.card.ownerId !== args.playerId) {
        return false;
      }
      const typeCheckResult = actionTypeChecks[a.type]({
        actionData: a,
        accessor: args.accessor,
      });
      if (!typeCheckResult.ok) {
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
  if (!actionDef.sequence?.choices) {
    // Not all actions have choices (e.g. "play" or "discard" type actions).
    // In those cases, send a special choice to signal the state machine.
    return { currentChoice: nullChoice(), nextChoices: [] };
  }
  const firstChoiceDef = actionDef.sequence.choices[0];
  const firstChoices = createActionChoices({
    choiceDef: firstChoiceDef,
    accessor: args.accessor,
    currentDecisions: args.decisions,
    actionContext: {
      cardId: args.actionData.card.id,
      playerTakingActionId: args.playerData.id,
    },
  });
  // The rest of the choices are "dependent", because they may depend on
  // decisions made for previous choices.
  const dependentChoices: NextChoiceData[] = actionDef.sequence.choices
    .slice(1)
    .map((_, i) => ({ type: "dependent", index: i + 1 }));
  // If no viable players for first choice, send a null current choice and move
  // on.
  if (firstChoices.length < 1) {
    return { currentChoice: nullChoice(), nextChoices: dependentChoices };
  }
  const nextChoices: NextChoiceData[] = firstChoices
    .slice(1)
    .map((choice) => ({ type: "independent", choice }));
  nextChoices.push(...dependentChoices);
  return { currentChoice: firstChoices[0], nextChoices };
}
