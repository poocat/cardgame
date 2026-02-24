import type { CardDef } from "@server/game/types";

export const exampleProducerThatCanDie: CardDef = {
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
                .getChips({
                  playerIds: [context.choosingPlayerId],
                })
                .map((c) => c.id);
            },
          },
        ],
        affect: ({ decisions, mutator, context }) => {
          mutator.moveChips({
            ids: decisions.getValues({ name: "targetChips" }),
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
  trigger: {
    instructions:
      "Whenever the last chip is removed from this card, discard it.",
    affect: ({ next, context, mutator }) => {
      if (next.getChips({ cardIds: [context.cardId] }).length < 1) {
        mutator.moveCard({
          id: context.cardId,
          location: { type: "inDiscard" },
        });
      }
    },
  },
};
