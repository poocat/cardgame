import { CardDef } from "@server/types";

export const CARDS: CardDef[] = [
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
              instructions: "Move one chip from your reserve to this card.",
              min: 1,
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
      discard: {},
    },
  },
  {
    name: "Example Consumer",
    type: "consumer",
    actions: {
      play: {
        instructions: "Bring into play with 1 chip from one of your producers.",
        sequence: {
          check: ({ gameState, context }) => {
            const producersInPlayIds = gameState
              .getPlayerCardsInPlay({
                playerId: context.playerTakingActionId,
              })
              .filter((c) => c.type === "producer")
              .map((c) => c.id);
            const hasChips = gameState.chips.some(
              (c) =>
                c.location.type === "onCard" &&
                producersInPlayIds.includes(c.location.cardId),
            );
            return hasChips
              ? { ok: true }
              : {
                ok: false,
                reasons: ["No producer cards with chips on them."],
              };
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
          "Move one chip from this card to one of your consumers in play.",
        sequence: {
          check: ({ gameState, context }) => {
            const candidates = gameState
              .getPlayerCardsInPlay({ playerId: context.playerTakingActionId })
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
              instructions: "Choose a chip from the chosen producer card.",
              min: 1,
              max: 1,
              getValues: ({ gameState, currentDecisions }) => {
                const chosenCardId = currentDecisions.get("targetCard")[0];
                if (chosenCardId) {
                  return gameState
                    .getChipsOnCard({ cardId: chosenCardId })
                    .map((c) => c.id);
                } else {
                  return [];
                }
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
];
