import type { CardDef } from "@server/game/types";

export const exampleConsumer: CardDef = {
  name: "Example Consumer",
  type: "consumer",
  actions: {
    play: {
      instructions: {
        key: "Bring into play with 1 chip from one of your producers.",
      },
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
            instructions: {
              key: "Move one chip from one of your producers onto this card.",
            },
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
            ids: decisions.getValues({ name: "targetChips" }),
            location: { type: "onCard", cardId: context.cardId },
          });
        },
      },
    },
    ability: {
      instructions: {
        key: "Move one chip from this card to one of your producers in play.",
      },
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
            instructions: { key: "Choose one of your producer cards." },
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
            instructions: { key: "Choose a chip from this card." },
            min: 1,
            max: 1,
            getValues: ({ accessor, context }) => {
              return accessor
                .getChips({ cardIds: [context.cardId] })
                .map((c) => c.id);
            },
          },
        ],
        affect: ({ decisions, mutator }) => {
          const chosenCardId = decisions.getValues({ name: "targetCard" })[0];
          if (chosenCardId) {
            mutator.moveChips({
              ids: decisions.getValues({ name: "targetChips" }),
              location: { type: "onCard", cardId: chosenCardId },
            });
          }
        },
      },
    },
  },
};
