import type { CardDef } from "@server/game/types";

export const exampleProducer: CardDef = {
  name: "Example Producer",
  type: "producer",
  actions: {
    play: {},
    ability: {
      instructions: {
        key: "Move up to one chip from your reserve to this card.",
      },
      sequence: {
        choices: [
          {
            type: "chipId",
            name: "targetChips",
            instructions: {
              key: "Move up to one chip from your reserve to this card.",
            },
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
        affect: ({ context, decisions, mutator }) => {
          mutator.moveChips({
            ids: decisions.getValues({ name: "targetChips" }),
            location: { type: "onCard", cardId: context.cardId },
          });
        },
      },
    },
    // discard: {},
  },
};
