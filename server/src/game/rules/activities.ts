/**
 * An activity is a sequence of choices that are made to affect the game state.
 *
 * Some are configured as "scripted" parts of the game (e.g. drawing cards at
 * the beginning of a player's turn).
 *
 * Most, however, are configured from the cards themselves.
 */
import {
  ActionData,
  ActivityData,
  ActivityTypeMap,
  ChoiceData,
  Decision,
  Id,
  NextChoiceData,
  PlayerData,
} from "@common/types";
import { getActionDefinition } from "@server/game/cards/utils";
import {
  actionTypeChecks,
  actionTypeDefaultEffects,
} from "@server/game/rules/actions";
import { cardTypeTriggeredEffects } from "@server/game/rules/cards";
import { CONFIG } from "@server/game/rules/config";
import { Decisions } from "@server/game/utils/Decisions";
import { GameState } from "@server/game/utils/GameState";
import { ActionContext, ChoiceDef, IMutator } from "@server/types";

/******************************************************************************
 * A reusable "null choice". Signals to the state machine that the game state
 * should be passed back through the state machine.
 *
 * Note, any choice that has a `max` value of 0 will be interpreted as a "null
 * choice".
 ******************************************************************************/
const NULL_CHOICE: ChoiceData = {
  name: "",
  type: "arbitrary",
  choosingPlayerId: "",
  values: [],
  min: 0,
  max: 0,
};

/******************************************************************************
 * Feeds the current game state, and all the currently made decisions, into the
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
function createActionChoices(args: {
  choiceDef: ChoiceDef;
  gameState: GameState;
  currentDecisions: Decisions;
  actionContext: ActionContext;
}): ChoiceData[] {
  const choosingPlayerIds: Id[] = [];
  if (!args.choiceDef.getChoosingPlayers) {
    // By default, the choosing player is the one taking the action.
    choosingPlayerIds.push(args.actionContext.playerTakingActionId);
  } else {
    choosingPlayerIds.push(
      ...args.choiceDef.getChoosingPlayers({
        gameState: args.gameState,
        currentDecisions: args.currentDecisions,
        context: args.actionContext,
      }),
    );
  }
  return choosingPlayerIds.map((playerId) => {
    const values = args.choiceDef.getValues({
      gameState: args.gameState,
      currentDecisions: args.currentDecisions,
      context: { ...args.actionContext, choosingPlayerId: playerId },
    });
    return {
      name: args.choiceDef.name,
      type: args.choiceDef.type,
      min: args.choiceDef.min,
      max: args.choiceDef.max,
      choosingPlayerId: playerId,
      values,
    };
  });
}

/******************************************************************************
 * Generates the single choice for the "drawingCards" activity.
 ******************************************************************************/
function createDrawingCardsChoice(args: {
  playerId: Id;
  gameState: GameState;
}): ChoiceData {
  const values = args.gameState
    .getPlayerCardsInDeck({ playerId: args.playerId })
    .slice(0, 1)
    .map((c) => c.id);
  return {
    name: "cardsToDraw",
    type: "cardId",
    choosingPlayerId: args.playerId,
    values,
    // If nothing left in the deck, allow zero choices.
    min: Math.min(values.length, 1),
    max: 1,
  };
}

/******************************************************************************
 * Generates the single choice for the "choosingAction" activity.
 ******************************************************************************/
function createChoosingActionChoice(args: {
  playerId: Id;
  gameState: GameState;
}): ChoiceData {
  // Filtering through every action seems dumb, but...
  const values = args.gameState.actions
    .filter((a) => {
      if (a.card.ownerPlayerId !== args.playerId) {
        return false;
      }
      const typeCheckResult = actionTypeChecks[a.type]({
        actionData: a,
        gameState: args.gameState,
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
          gameState: args.gameState,
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
 * given the current game state...
 ******************************************************************************/
function createTakingActionChoices(args: {
  playerData: PlayerData;
  gameState: GameState;
  actionData: ActionData;
  decisions: Decision[];
}): Pick<ActivityData, "currentChoice" | "nextChoices"> {
  const actionDef = getActionDefinition({
    cardName: args.actionData.card.name,
    actionType: args.actionData.type,
  });
  if (!actionDef.sequence?.choices) {
    // Not all actions have choices (e.g. "play" or "discard" type actions).
    // In those cases, send a special choice to signal the state machine.
    return { currentChoice: NULL_CHOICE, nextChoices: [] };
  }
  const firstChoiceDef = actionDef.sequence.choices[0];
  const firstChoices = createActionChoices({
    choiceDef: firstChoiceDef,
    gameState: args.gameState,
    currentDecisions: new Decisions(args.decisions),
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
    return { currentChoice: NULL_CHOICE, nextChoices: dependentChoices };
  }
  const nextChoices: NextChoiceData[] = firstChoices
    .slice(1)
    .map((choice) => ({ type: "independent", choice }));
  nextChoices.push(...dependentChoices);
  return { currentChoice: firstChoices[0], nextChoices };
}

/******************************************************************************
 * ### Activity Generators/Mutators by Previous Activity Type
 *
 * Generates the activity that should follow the conclusion of an activity of
 * the given type, and applies it to the game data via the given mutator.
 ******************************************************************************/
export const activityTypeNextActivity: ActivityTypeMap<
  (args: {
    playerData: PlayerData;
    /** This game state should have already been mutated by the effects of the given activity. */
    gameState: GameState;
    currentDecisions: Decision[];
    mutator: IMutator;
  }) => void
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * In most cases, after a "drawing cards" activity, move directly to
   * "choosing actions" activity.
   *
   * However, at the beginning of the game, repeat the "drawing cards" activity
   * until the entire opening hand is drawn.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  drawingCards: ({ playerData, gameState, mutator }) => {
    const cardsInHand = gameState.getPlayerCardsInHand({
      playerId: playerData.id,
    });
    const cardsInDeck = gameState.getPlayerCardsInDeck({
      playerId: playerData.id,
    });
    if (
      playerData.turnCount === 0 &&
      cardsInHand.length < CONFIG.OPENING_HAND_SIZE &&
      cardsInDeck.length > 0
    ) {
      // If it's the player's first turn, repeat the "drawingCards" activity until hand is the right size.
      mutator.setActivity({
        activity: {
          type: "drawingCards",
          currentChoice: createDrawingCardsChoice({
            playerId: playerData.id,
            gameState,
          }),
          nextChoices: [],
          previousDecisions: [],
        }
      });
    } else {
      // Otherwise, move on to the "choosingAction" activity.
      mutator.setActivity({
        activity: {
          type: "choosingAction",
          playerChoosingActionId: playerData.id,
          currentChoice: createChoosingActionChoice({
            playerId: playerData.id,
            gameState,
          }),
          nextChoices: [],
          previousDecisions: [],
        }
      });
    }
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * The conclusion of a "choosing action" activity should result in exactly
   * one decision being made, and yield either one or no values.
   *
   * If no values are chosen, the player is passing their turn.
   *
   * If one value is chosen, it is the action that should be taken, and thus,
   * the action definition must be used to generate the next set of choices.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  choosingAction: ({ playerData, gameState, currentDecisions, mutator }) => {
    const actionIds = currentDecisions[0].values ?? [];
    if (actionIds.length === 0) {
      // If nothing was chosen, then it's time to pass the turn.
      const playerIndex = gameState.players.findIndex(
        (p) => p.id === playerData.id,
      );
      const nextPlayerIndex = (playerIndex + 1) % gameState.players.length;
      const nextPlayerData = gameState.players[nextPlayerIndex];
      mutator.passTurn({ from: playerData.id, to: nextPlayerData.id });
      mutator.setActivity({
        activity: {
          type: "drawingCards",
          currentChoice: createDrawingCardsChoice({
            playerId: nextPlayerData.id,
            gameState,
          }),
          nextChoices: [],
          previousDecisions: [],
        }
      });
    } else if (actionIds.length === 1) {
      const actionData = gameState.getActionById({ actionId: actionIds[0] });
      const choices = createTakingActionChoices({
        playerData,
        gameState,
        actionData,
        decisions: currentDecisions,
      });
      mutator.setActivity({
        activity: {
          type: "takingAction",
          playerTakingActionId: playerData.id,
          actionId: actionIds[0],
          previousDecisions: [],
          ...choices,
        }
      });
    } else {
      throw new Error(
        `Expected one value selected for one choice; found ${actionIds.length} values and ${currentDecisions.length} decisions.`,
      );
    }
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Every "taking action" activity should be followed by a "choosing action"
   * activity.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  takingAction: ({ playerData, gameState, mutator }) => {
    mutator.setActivity({
      activity: {
        type: "choosingAction",
        playerChoosingActionId: playerData.id,
        currentChoice: createChoosingActionChoice({
          playerId: playerData.id,
          gameState,
        }),
        nextChoices: [],
        previousDecisions: [],
      }
    });
  },
};

/******************************************************************************
 * ### Activity Generators by Continued Activity
 *
 * If an activity requires more than one choice, it will need to be
 * "continued".
 ******************************************************************************/
export const activityTypeContinuedActivity: ActivityTypeMap<
  (args: {
    gameState: GameState;
    currentActivity: ActivityData;
    currentDecisions: Decision[];
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
  takingAction: ({ gameState, currentActivity, currentDecisions }) => {
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
      previousDecisions: currentDecisions,
    };
    const nextChoice = currentActivity.nextChoices[0];
    if (nextChoice.type === "dependent") {
      const action = gameState.getActionById({
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
      const nextActionChoices = createActionChoices({
        choiceDef,
        gameState: gameState,
        currentDecisions: new Decisions(currentDecisions),
        actionContext: {
          cardId: action.card.id,
          playerTakingActionId: currentActivity.playerTakingActionId,
        },
      });
      next.currentChoice = nextActionChoices[0] ?? NULL_CHOICE;
      const remaining: NextChoiceData[] = nextActionChoices.map((choice) => ({
        type: "independent",
        choice,
      }));
      next.nextChoices = [...remaining, ...next.nextChoices];
    } else {
      next.currentChoice = nextChoice.choice;
    }
    return next;
  },
};

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
  choosingAction: () => { },

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

/******************************************************************************
 * ## Triggers by Activity Type
 *
 * Effects that are triggered by changes in game state that came about as a
 * result of concluding the given activity type.
 *
 * Note: these are not applied in a loop! Be careful that triggers do not rely
 * on other triggers!
 ******************************************************************************/
export const activityTypeTriggeredEffects: ActivityTypeMap<
  (args: {
    /** The game state before any effects were applied to the game data. */
    current: GameState;
    /** The game state after any effects were applied at the conclusion of the current activity. */
    next: GameState;
    mutator: IMutator;
  }) => void
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * The "draw cards" activity is always the first part of the turn.
   *
   * All a player's cards in play should be unexhausted at the conclusion of
   * this activity, in preparation for the "choosing action" activity.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  drawingCards: ({ next, mutator }) => {
    const playerTakingTurn = next.getPlayerTakingTurn();
    next
      .getPlayerCardsInPlay({ playerId: playerTakingTurn.id })
      .forEach((c) => mutator.exhaustCard({ id: c.id, value: false }));
  },

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   *
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  choosingAction: () => { },

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A number of default triggers are checked at the conclusion of a "taking
   * action" activity.
   *
   * E.g.:
   * - "dead" "consumer" cards are discarded
   * - chips that were located on cards that left play need to return to the
   * "reserve"
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  takingAction: ({ current, next, mutator }) => {
    const cardsInPlay = current.getAllCardsInPlay();
    // Trigger effects based on card type.
    cardsInPlay.forEach((cardData) =>
      cardTypeTriggeredEffects[cardData.type]({
        cardData,
        gameState: next,
        mutator,
      }),
    );
    // Clean up any chips that are located on cards that are no longer in play.
    const cardsInPlayIds = cardsInPlay.map((c) => c.id);
    const strayChipIds = current.chips
      .filter(
        (c) =>
          c.location.type === "onCard" &&
          !cardsInPlayIds.includes(c.location.cardId),
      )
      .map((c) => c.id);
    if (strayChipIds.length > 0) {
      mutator.moveChips({ ids: strayChipIds, location: { type: "inReserve" } });
    }
  },
};
