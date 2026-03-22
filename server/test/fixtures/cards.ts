/**
 * A collection of cards defined solely for the purposes of testing various
 * mechanics that could be implemented in the cards' actions.
 */

import type { CardDef } from "@server/game/types";
import { msg } from "@server/text/messages";

type CardMap = { [key: string]: CardDef };

export const testCards = {
  dummyProducer: {
    name: "Dummy Producer",
    type: "producer",
    actions: {
      play: {},
      ability: {},
      discard: {},
    },
  },
  dummyConsumer: {
    name: "Dummy Consumer",
    type: "consumer",
    actions: {},
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A producer that can be brought into play without any conditions, can be
   * discarded, and has an action that is always available (so long as the card
   * is in play), which requires one choice (which cannot be made
   * automatically), and does not affect the game state.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  basicProducer: {
    name: "Playable Producer",
    type: "producer",
    actions: {
      play: {},
      ability: {
        instructions: msg("Choose this card and do nothing."),
        sequence: {
          choices: [
            {
              type: "cardId",
              name: "cardId",
              instructions: msg("Choose this card."),
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
   * A producer with all action types, but actions are trivial (do not require
   * choices, and do not affect game state except for triggered effects).
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  producerWithTrivialActions: {
    name: "Dummy Producer",
    type: "producer",
    actions: {
      play: {},
      ability: {},
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
        instructions: msg(
          "Move one chip from this card to one of your consumers.",
        ),
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
              instructions: msg("Choose one of your consumer cards."),
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
              instructions: msg("Choose a chip from this card."),
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
      instructions: msg(
        "Whenever the last chip is removed from this card, discard it.",
      ),
      affect: ({ current, next, context, mutator }) => {
        // The comparison with "current" is unnecessary to the condition of the
        // trigger, but necessary to ensure that the state machine keeps track
        // of the current state separately from the next.
        const currentChips = current.getChips({ cardIds: [context.cardId] });
        const nextChips = next.getChips({ cardIds: [context.cardId] });
        if (currentChips.length > 0 && nextChips.length === 0) {
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
        instructions: msg(
          "Move up to one chip from your reserve to this card.",
        ),
        sequence: {
          choices: [
            {
              type: "chipId",
              name: "targetChips",
              instructions: msg(
                "Move up to one chip from your reserve to this card.",
              ),
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
        instructions: msg(
          "Bring into play with 1 chip from one of your producers.",
        ),
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
              instructions: msg(
                "Move one chip from one of your producers onto this card.",
              ),
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
        instructions: msg("Bring into play with 1 chip from your reserve."),
        sequence: {
          choices: [
            {
              type: "chipId",
              name: "targetChips",
              instructions: msg("Choose a chip from your reserve."),
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
        instructions: msg(
          "Move one chip from this card to one of your producers in play.",
        ),
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
              instructions: msg("Choose one of your producer cards."),
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
              instructions: msg("Choose a chip from this card."),
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
        instructions: msg(
          "Each player may move up to 1 chip from their reserve to one of their consumers in play.",
        ),
        sequence: {
          getPlayers: ({ accessor }) =>
            accessor.players.filter((p) => {
              const chipsInReserve = accessor.getChips({
                playerIds: [p.id],
                locationTypes: ["inReserve"],
              });
              const consumersInPlay = accessor.getCards({
                playerIds: [p.id],
                locationTypes: ["inPlay"],
                types: ["consumer"],
              });
              return chipsInReserve.length > 0 && consumersInPlay.length > 0;
            }),
          choices: [
            {
              name: "targetChip",
              type: "chipId",
              instructions: msg("Choose up to 1 of the chips in your reserve."),
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
            {
              name: "targetConsumer",
              type: "cardId",
              instructions: msg("Choose which consumer to move the chip to."),
              min: 0,
              max: 1,
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
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A producer with an ability that moves chips onto itself from various
   * pools.
   * - 1 from either its owner's reserve or its owner's channel
   * - 1 from one of its owner's other cards in play
   *
   * Can be used to test the auto-decision feature.
   * - If there are no chips in the owner's channel, then the first choice is
   *   homogeneous, and can be made automatically.
   * - If there is only one other card in play, then the second choice is
   *   homogeneous, and can be made automatically.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  producerWithChipChoices: {
    name: "Producer with Various Chip Choices",
    type: "producer",
    actions: {
      play: {},
      ability: {
        instructions: msg(
          "Move 1 chip from either your reserve or channel, and 1 chip from one of your other cards in play.",
        ),
        sequence: {
          choices: [
            {
              type: "chipId",
              name: "chips",
              instructions: msg("Choose 1 chip from your reserve or channel."),
              min: 1,
              max: 1,
              getValues: ({ accessor, context }) => {
                return accessor
                  .getChips({
                    playerIds: [context.choosingPlayerId],
                    locationTypes: ["inReserve", "inChannel"],
                  })
                  .map((c) => c.id);
              },
            },
            {
              type: "chipId",
              name: "chips",
              instructions: msg(
                "Choose 1 chip from another one of your cards in play.",
              ),
              min: 1,
              max: 1,
              getValues: ({ accessor, context }) => {
                const otherCardsInPlay = accessor.getCards({
                  playerIds: [context.playerTakingActionId],
                  locationTypes: ["inPlay"],
                  excludeIds: [context.cardId],
                });
                return accessor
                  .getChips({
                    cardIds: otherCardsInPlay.map((c) => c.id),
                  })
                  .map((c) => c.id);
              },
            },
          ],
          affect: ({ context, decisions, mutator }) => {
            mutator.moveChips({
              ids: decisions.getValues({ name: "chips" }),
              location: { type: "onCard", cardId: context.cardId },
            });
          },
        },
      },
    },
  },
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A producer with an ability that changes whose turn it is.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  producerThatPassesTurn: {
    name: "Producer that Passes Turn",
    type: "producer",
    actions: {
      ability: {
        instructions: msg("Pass the turn to the next player"),
        sequence: {
          choices: [],
          affect: ({ accessor, mutator }) => {
            const { from, to } = accessor.getTurnTransition({});
            mutator.passTurn({ from: from.id, to: to.id });
          },
        },
      },
    },
  },
} as const satisfies CardMap;
