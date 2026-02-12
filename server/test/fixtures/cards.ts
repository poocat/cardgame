import type { CardDef } from "@server/game/types";

type CardMap = { [key: string]: CardDef };

export const testCards = {
  dummyProducer: {
    name: "Dummy Producer",
    type: "producer",
    actions: {},
  },
  dummyConsumer: {
    name: "Dummy Consumer",
    type: "consumer",
    actions: {},
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A producer that can be brought into play without any conditions, can be
   * discarded, and has an action that is always available (so long as the card
   * is in play), and does not affect the game state.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  basicProducer: {
    name: "Playable Producer",
    type: "producer",
    actions: {
      play: {},
      ability: {
        instructions: "Choose this card and do nothing.",
        sequence: {
          choices: [
            {
              type: "cardId",
              name: "cardId",
              instructions: "Choose this card.",
              min: 1,
              max: 1,
              getValues: ({ context }) => [context.cardId],
            },
          ],
          affect: () => {},
        },
      },
      discard: {},
    },
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to test a simple "trigger" for producer-type cards that mimics the
   * rules for consumer-type cards, in that they must have at least one chip
   * on them to stay in play.
   * Has an ability to move chips from this card to a consumer (to trigger death).
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  producerThatCanDie: {
    name: "Producer That Can Die",
    type: "producer",
    actions: {
      ability: {
        instructions: "Move one chip from this card to one of your consumers.",
        sequence: {
          check: ({ accessor, context }) => {
            const candidates = accessor.getCards({
              playerIds: [context.playerTakingActionId],
              locationTypes: ["inPlay"],
              types: ["consumer"],
            });
            if (candidates.length > 0) {
              return { ok: true };
            } else {
              return {
                ok: false,
                reasons: ["No consumers in play."],
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
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A producer with an ability that moves chips from reserve to the card.
   * Tests: ability with optional chip choice (min=0, max=1).
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  producerWithChipAbility: {
    name: "Producer With Chip Ability",
    type: "producer",
    actions: {
      play: {},
      ability: {
        instructions: "Move up to one chip from your reserve to this card.",
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
                  .getChips({
                    playerIds: [context.choosingPlayerId],
                    locationTypes: ["inReserve"],
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
    },
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A consumer with a play action that has a check (requires producer with
   * chips) and moves a chip from a producer to itself.
   * Tests: play with check function + chip transfer sequence.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  consumerWithPlayCheck: {
    name: "Consumer With Play Check",
    type: "consumer",
    actions: {
      play: {
        instructions: "Bring into play with 1 chip from one of your producers.",
        sequence: {
          check: ({ accessor, context }) => {
            const candidates = accessor.getCards({
              playerIds: [context.playerTakingActionId],
              types: ["producer"],
              locationTypes: ["inPlay"],
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
                    locationTypes: ["inPlay"],
                  })
                  .map((c) => c.id);
                return accessor
                  .getChips({ cardIds: producersInPlayIds })
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
    },
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A consumer with a two-step ability: choose a target producer, then choose
   * a chip from this card to move to that producer.
   * Tests: dependent choices (second choice depends on first).
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  consumerWithTwoStepAbility: {
    name: "Consumer With Two-Step Ability",
    type: "consumer",
    actions: {
      play: {
        instructions: "Bring into play with 1 chip from your reserve.",
        sequence: {
          choices: [
            {
              type: "chipId",
              name: "targetChips",
              instructions: "Choose a chip from your reserve.",
              min: 1,
              max: 1,
              getValues: ({ accessor, context }) => {
                return accessor
                  .getChips({
                    playerIds: [context.choosingPlayerId],
                    locationTypes: ["inReserve"],
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
                reasons: ["No producers in play."],
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
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A producer with an ability that involves all players. Each player with
   * chips in reserve and consumers in play can move a chip to their consumer.
   * Tests: getChoosingPlayers returning multiple players.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  producerWithMultiPlayerAbility: {
    name: "Producer With Multi-Player Ability",
    type: "producer",
    actions: {
      play: {},
      ability: {
        instructions:
          "Each player may move up to 1 chip from their reserve to one of their consumers in play.",
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
                      locationTypes: ["inReserve"],
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
                    locationTypes: ["inReserve"],
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
            decisions
              .getPlayerIds({ name: "targetChip" })
              .forEach((playerId) => {
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
  },
} as const satisfies CardMap;
