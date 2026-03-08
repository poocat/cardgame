import { CONSTANTS } from "@common/game/constants";
import type { IAccessor, IDecisions, IMutator } from "@server/game/types";
import type { ActivityTypeMap, PlayerData } from "@server/types";
import {
  createChoosingActionChoice,
  createDrawingCardsChoice,
  createTakingActionChoices,
} from "./choices";

/******************************************************************************
 * ### Activity State Transitions
 *
 * Generates the next activity based on the completed activity type.
 * Co-located with choices and continuation logic since they all manage
 * activity state transitions.
 ******************************************************************************/
export const activityTypeNextActivity: ActivityTypeMap<
  (args: {
    playerData: PlayerData;
    /** This game data should have already been mutated by the effects of the given activity. */
    accessor: IAccessor;
    currentDecisions: IDecisions;
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
  drawingCards: ({ playerData, accessor, mutator }) => {
    const cardsInHand = accessor.getCards({
      playerIds: [playerData.id],
      locationTypes: ["inHand"],
    });
    const cardsInDeck = accessor.getCards({
      playerIds: [playerData.id],
      locationTypes: ["inDeck"],
    });
    if (
      playerData.turnCount === 0 &&
      cardsInHand.length < CONSTANTS.openingHandSize &&
      cardsInDeck.length > 0
    ) {
      // If it's the player's first turn, repeat the "drawingCards" activity until hand is the right size.
      mutator.setActivity({
        activity: {
          type: "drawingCards",
          currentChoice: createDrawingCardsChoice({
            playerId: playerData.id,
            accessor,
          }),
          nextChoices: [],
          previousDecisions: [],
        },
      });
    } else {
      // Otherwise, move on to the "choosingAction" activity.
      mutator.setActivity({
        activity: {
          type: "choosingAction",
          playerChoosingActionId: playerData.id,
          currentChoice: createChoosingActionChoice({
            playerId: playerData.id,
            accessor,
          }),
          nextChoices: [],
          previousDecisions: [],
        },
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
  choosingAction: ({ playerData, accessor, currentDecisions, mutator }) => {
    const actionIds = currentDecisions.decisions[0].values ?? [];
    if (actionIds.length === 0) {
      // If nothing was chosen, then it's time to pass the turn.
      const { from, to } = accessor.getTurnTransition({});
      mutator.passTurn({ from: from.id, to: to.id });
      mutator.setActivity({
        activity: {
          type: "drawingCards",
          currentChoice: createDrawingCardsChoice({
            playerId: to.id,
            accessor,
          }),
          nextChoices: [],
          previousDecisions: [],
        },
      });
    } else if (actionIds.length === 1) {
      const actionData = accessor.getActionById({ actionId: actionIds[0] });
      const choices = createTakingActionChoices({
        playerData,
        accessor,
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
        },
      });
    } else {
      throw new Error(
        `Expected one value selected for one choice; found ${actionIds.length} values and ${currentDecisions.decisions.length} decisions.`,
      );
    }
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A "taking action" activity is typically followed by a "choosing action"
   * activity.
   *
   * However, if the taken action resulted in a change to the player on turn,
   * facilitate the beginning of that player's turn.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  takingAction: ({ playerData, accessor, mutator }) => {
    const playerTakingTurnId = accessor.getPlayerTakingTurn().id;
    if (playerTakingTurnId !== playerData.id) {
      mutator.setActivity({
        activity: {
          type: "drawingCards",
          currentChoice: createDrawingCardsChoice({
            playerId: playerTakingTurnId,
            accessor,
          }),
          nextChoices: [],
          previousDecisions: [],
        },
      });
    } else {
      mutator.setActivity({
        activity: {
          type: "choosingAction",
          playerChoosingActionId: playerData.id,
          currentChoice: createChoosingActionChoice({
            playerId: playerData.id,
            accessor,
          }),
          nextChoices: [],
          previousDecisions: [],
        },
      });
    }
  },
};
