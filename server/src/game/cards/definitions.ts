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
      // discard: {},
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
  ////////////////////////////////////////////////////////////////////////////////
  {
    name: "Example that Involves All Players",
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
              instructions: "Choose one of the chips in your reserve.",
              min: 0,
              max: 1,
              getChoosingPlayers: ({ gameState }) =>
                gameState.players
                  .filter((p) => {
                    // TODO!!! Conditions for being able to make this choice.
                    return true;
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
