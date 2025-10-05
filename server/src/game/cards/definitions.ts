/**
 * Serves as the master list of all cards in the game.
 *
 * One day, will come up with a schema to replace callbacks with serializable
 * objects...
 */
import { CardDef } from "@server/types";

export const CARDS: CardDef[] = [
	/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 *
	 ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	{
		name: "Example Producer",
		type: "producer",
		actions: {
			play: {},
			ability: {
				sequence: {
					choices: [
						{
							type: "chipId",
							name: "targetChips",
							instructions:
								"Move up to one chip from your reserve to this card.",
							min: 0,
							max: 1,
							getValues: ({ gameState, context }) => {
								return gameState
									.getPlayerChipsInReserve({
										playerId: context.choosingPlayerId,
									})
									.map((c) => c.id);
							},
						},
					],
					affect: ({ context, decisions, mutator }) => {
						mutator.moveChips({
							ids: decisions.get("targetChips"),
							location: { type: "onCard", cardId: context.cardId },
						});
					},
				},
			},
			// discard: {},
		},
	},
	/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 *
	 ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	{
		name: "Example Consumer",
		type: "consumer",
		actions: {
			play: {
				instructions: "Bring into play with 1 chip from one of your producers.",
				sequence: {
					check: ({ gameState, context }) => {
						const candidates = gameState
							.getPlayerCardsInPlay({
								playerId: context.playerTakingActionId,
							})
							.some(
								(c) =>
									c.type === "producer" &&
									gameState.getChipsOnCard({ cardId: c.id }).length > 0,
							);
						if (candidates) {
							return { ok: true };
						} else {
							return {
								ok: false,
								reasons: ["No producers in play with chips on them."],
							};
						}
					},
					choices: [
						{
							type: "chipId",
							name: "targetChips",
							instructions:
								"Move one chip from one of your producers onto this card.",
							min: 1,
							max: 1,
							getValues: ({ gameState, context }) => {
								const producersInPlayIds = gameState
									.getPlayerCardsInPlay({
										playerId: context.choosingPlayerId,
									})
									.filter((c) => c.type === "producer")
									.map((c) => c.id);
								return gameState.chips
									.filter(
										(c) =>
											c.location.type === "onCard" &&
											producersInPlayIds.includes(c.location.cardId),
									)
									.map((c) => c.id);
							},
						},
					],
					affect: ({ context, decisions, mutator }) => {
						mutator.moveChips({
							ids: decisions.get("targetChips"),
							location: { type: "onCard", cardId: context.cardId },
						});
					},
				},
			},
			ability: {
				instructions:
					"Move one chip from this card to one of your producers in play.",
				sequence: {
					check: ({ gameState, context }) => {
						const candidates = gameState
							.getPlayerCardsInPlay({ playerId: context.playerTakingActionId })
							.some((c) => c.type === "producer");
						if (candidates) {
							return { ok: true };
						} else {
							return {
								ok: false,
								reasons: ["No other producers in play."],
							};
						}
					},
					choices: [
						{
							type: "cardId",
							name: "targetCard",
							instructions: "Choose one of your producer cards.",
							min: 1,
							max: 1,
							getValues: ({ gameState, context }) => {
								return gameState
									.getPlayerCardsInPlay({ playerId: context.choosingPlayerId })
									.filter((c) => c.type === "producer")
									.map((c) => c.id);
							},
						},
						{
							type: "chipId",
							name: "targetChips",
							instructions: "Choose a chip from this card.",
							min: 1,
							max: 1,
							getValues: ({ gameState, context }) => {
								return gameState
									.getChipsOnCard({ cardId: context.cardId })
									.map((c) => c.id);
							},
						},
					],
					affect: ({ decisions, mutator }) => {
						const chosenCardId = decisions.get("targetCard")[0];
						if (chosenCardId) {
							mutator.moveChips({
								ids: decisions.get("targetChips"),
								location: { type: "onCard", cardId: chosenCardId },
							});
						}
					},
				},
			},
		},
	},
	/** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 *
	 ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
	{
		name: "Example Producer that Involves All Players",
		type: "producer",
		actions: {
			play: {},
			ability: {
				instructions:
					"Each player may move up to 1 of their chips from their reserve to one of their consumers in play.",
				sequence: {
					choices: [
						{
							name: "targetChip",
							type: "chipId",
							instructions: "Choose up to 1 of the chips in your reserve.",
							min: 0,
							max: 1,
							getChoosingPlayers: ({ gameState }) =>
								gameState.players
									.filter((p) => {
										const chipsInReserve = gameState.getPlayerChipsInReserve({
											playerId: p.id,
										});
										const consumersInPlay = gameState
											.getPlayerCardsInPlay({ playerId: p.id })
											.filter((c) => c.type === "consumer");
										return (
											chipsInReserve.length > 0 && consumersInPlay.length > 0
										);
									})
									.map((p) => p.id),
							getValues: ({ gameState, context }) => {
								return gameState
									.getPlayerChipsInReserve({
										playerId: context.choosingPlayerId,
									})
									.map((c) => c.id);
							},
						},
						{
							name: "targetConsumer",
							type: "cardId",
							instructions: "Choose which consumer to move the chip to.",
							min: 1,
							max: 1,
							getChoosingPlayers: ({ currentDecisions }) =>
								currentDecisions.getPlayerIds("targetChip"),
							getValues: ({ gameState, context }) =>
								gameState
									.getPlayerCardsInPlay({ playerId: context.choosingPlayerId })
									.filter((c) => c.type === "consumer")
									.map((c) => c.id),
						},
					],
					affect: ({ decisions, mutator }) => {
						decisions.getPlayerIds("targetChip").forEach((playerId) => {
							const chipIds = decisions.get("targetChip", playerId);
							decisions.get("targetCard", playerId).forEach((cardId) => {
								mutator.moveChips({
									ids: chipIds,
									location: { type: "onCard", cardId: cardId },
								});
							});
						});
					},
				},
			},
		},
	},
];
