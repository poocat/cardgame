import type { CardDef } from "@server/game/types";

export const exampleProducerThatInvolvesAllPlayers: CardDef = {
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
                  const chipsInReserve = accessor.getChips({
                    playerIds: [p.id],
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
                .getChips({
                  playerIds: [context.choosingPlayerId],
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
              currentDecisions.getPlayerIds({ name: "targetChip" }),
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
          decisions.getPlayerIds({ name: "targetChip" }).forEach((playerId) => {
            const chipIds = decisions.getValues({
              name: "targetChip",
              playerId,
            });
            decisions
              .getValues({ name: "targetConsumer", playerId })
              .forEach((cardId) => {
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
};
