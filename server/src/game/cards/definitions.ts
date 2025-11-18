/**
 * Serves as the master list of all cards in the game.
 *
 * One day, will come up with a schema to replace callbacks with serializable
 * objects...
 */
import { CardDef } from "@server/game/types";

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
              getValues: ({ accessor, context }) => {
                return accessor
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
          check: ({ accessor, context }) => {
            const candidates = accessor.getCards({
              playerIds: [context.playerTakingActionId],
              types: ["producer"],
              minChips: 1,
            });
            if (candidates.length > 0) {
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
              getValues: ({ accessor, context }) => {
                const producersInPlayIds = accessor
                  .getCards({
                    playerIds: [context.choosingPlayerId],
                    types: ["producer"],
                  })
                  .map((c) => c.id);
                return accessor.chips
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
          check: ({ accessor, context }) => {
            const candidates = accessor.getCards({
              playerIds: [context.playerTakingActionId],
              types: ["producer"],
              locationTypes: ["inPlay"],
            });
            if (candidates.length > 0) {
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
              getValues: ({ accessor, context }) => {
                return accessor
                  .getCards({
                    playerIds: [context.choosingPlayerId],
                    locationTypes: ["inPlay"],
                    types: ["producer"],
                  })
                  .map((c) => c.id);
              },
            },
            {
              type: "chipId",
              name: "targetChips",
              instructions: "Choose a chip from this card.",
              min: 1,
              max: 1,
              getValues: ({ accessor, context }) => {
                return accessor
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
              getChoosingPlayers: ({ accessor }) =>
                accessor.players
                  .filter((p) => {
                    const chipsInReserve = accessor.getPlayerChipsInReserve({
                      playerId: p.id,
                    });
                    const consumersInPlay = accessor.getCards({
                      playerIds: [p.id],
                      locationTypes: ["inPlay"],
                      types: ["consumer"],
                    });
                    return (
                      chipsInReserve.length > 0 && consumersInPlay.length > 0
                    );
                  })
                  .map((p) => p.id),
              getValues: ({ accessor, context }) => {
                return accessor
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
              getValues: ({ accessor, context }) =>
                accessor
                  .getCards({
                    playerIds: [context.choosingPlayerId],
                    locationTypes: ["inPlay"],
                    types: ["consumer"],
                  })
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
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Producers don't need chips on them to remain alive after the conclusion of
   * an activity. To make an exception, set up a trigger.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  {
    name: "Example Producer that Can Die",
    type: "producer",
    actions: {
      play: {
        instructions: "Bring into play with up to 1 chip from your reserve.",
        sequence: {
          choices: [
            {
              name: "targetChips",
              type: "chipId",
              instructions: "Choose up to 1 of the chips in your reserve.",
              min: 0,
              max: 1,
              getValues: ({ accessor, context }) => {
                return accessor
                  .getPlayerChipsInReserve({
                    playerId: context.choosingPlayerId,
                  })
                  .map((c) => c.id);
              },
            },
          ],
          affect: ({ decisions, mutator, context }) => {
            mutator.moveChips({
              ids: decisions.get("targetChips"),
              location: { type: "onCard", cardId: context.cardId },
            });
          },
        },
      },
      ability: {
        instructions:
          "Move one chip from this card to one of your other consumers in play.",
        sequence: {
          check: ({ accessor, context }) => {
            const candidates = accessor.getCards({
              playerIds: [context.playerTakingActionId],
              locationTypes: ["inPlay"],
              types: ["consumer"],
              excludeIds: [context.cardId],
            });
            if (candidates.length > 0) {
              return { ok: true };
            } else {
              return {
                ok: false,
                reasons: ["No other consumers in play."],
              };
            }
          },
          choices: [
            {
              type: "cardId",
              name: "targetCard",
              instructions: "Choose one of your consumer cards.",
              min: 1,
              max: 1,
              getValues: ({ accessor, context }) => {
                return accessor
                  .getCards({
                    playerIds: [context.playerTakingActionId],
                    locationTypes: ["inPlay"],
                    types: ["consumer"],
                    excludeIds: [context.cardId],
                  })
                  .map((c) => c.id);
              },
            },
            {
              type: "chipId",
              name: "targetChips",
              instructions: "Choose a chip from this card.",
              min: 1,
              max: 1,
              getValues: ({ accessor, context }) => {
                return accessor
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
    trigger: {
      instructions:
        "Whenever the last chip is removed from this card, discard it.",
      affect: ({ next, context, mutator }) => {
        if (next.getChipsOnCard({ cardId: context.cardId }).length < 1) {
          mutator.moveCard({
            id: context.cardId,
            location: { type: "inDiscard" },
          });
        }
      },
    },
  },
];
