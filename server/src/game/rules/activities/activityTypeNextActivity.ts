import { ActivityTypeMap, Decision, PlayerData } from "@common/types";
import { CONFIG } from "@server/game/rules/config";
import { GameState } from "@server/game/utils/GameState";
import { IMutator } from "@server/types";
import {
	createChoosingActionChoice,
	createDrawingCardsChoice,
	createTakingActionChoices,
} from "@server/game/rules/activities/choices";

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
		const cardsInHand = gameState.getCards({
			playerIds: [playerData.id],
			locationTypes: ["inHand"],
		});
		const cardsInDeck = gameState.getCards({
			playerIds: [playerData.id],
			locationTypes: ["inDeck"],
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
						gameState,
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
				},
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
				},
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
			},
		});
	},
};
