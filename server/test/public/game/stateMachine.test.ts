import { CONSTANTS } from "@common/game/constants";
import {
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { Accessor } from "@server/game/runtime";
import { makeDecision } from "@server/game/stateMachine";
import type { GameData } from "@server/types";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testCards } from "../../fixtures/cards";
import { GameBuilder } from "../../helpers/GameBuilder";

beforeAll(() => {
  extendCardRegistry({ cards: Object.values(testCards) });
});

afterAll(() => {
  resetCardRegistry();
});

/******************************************************************************
 * ### buildBasicGame
 *
 * Builds a minimal game between two players, "alice" and "bob", that starts
 * with alice ready to draw her first card.
 ******************************************************************************/
function buildBasicGame(): GameData {
  const builder = new GameBuilder()
    .addPlayer("alice")
    .addPlayer("bob")
    .setPlayerTakingTurn("alice");

  for (const player of ["alice", "bob"]) {
    for (const cardDef of Object.values(testCards)) {
      builder.addCard({
        owner: player,
        name: cardDef.name,
        location: { type: "inDeck" },
      });
    }
    builder.addChipsInReserve(player, CONSTANTS.numChipsPerPlayer);
  }

  // Build without activity first to get actual card IDs
  const game = builder.build();

  // Set up initial drawing activity.
  game.activity = {
    type: "drawingCards",
    currentChoice: {
      name: "deck",
      type: "deck",
      values: ["producer", "consumer"],
      min: 1,
      max: 1,
      choosingPlayerId: "alice",
      instructions: "Choose deck.",
    },
    nextChoices: [],
    previousDecisions: [],
  };

  return game;
}

describe("makeDecision", () => {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Decision Validation
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("decision validation", () => {
    it("rejects decisions with too few values", () => {
      const game = buildBasicGame();
      // drawingCards requires min=1
      expect(() =>
        makeDecision({
          gameData: game,
          decision: {
            name: "deck",
            playerId: "alice",
            values: [],
          },
        }),
      ).toThrow("not enough values");
    });

    it("rejects decisions with too many values", () => {
      const game = buildBasicGame();
      // drawingCards requires max=1
      expect(() =>
        makeDecision({
          gameData: game,
          decision: {
            name: "deck",
            playerId: "alice",
            values: [game.activity.currentChoice.values[0], "extra"],
          },
        }),
      ).toThrow();
    });

    it("rejects decisions from wrong player", () => {
      const game = buildBasicGame();
      expect(() =>
        makeDecision({
          gameData: game,
          decision: {
            name: "deck",
            playerId: "bob",
            values: [game.activity.currentChoice.values[0]],
          },
        }),
      ).toThrow("wrong player");
    });

    it("rejects decisions with invalid values", () => {
      const game = buildBasicGame();
      expect(() =>
        makeDecision({
          gameData: game,
          decision: {
            name: "deck",
            playerId: "alice",
            values: ["not-a-deck"],
          },
        }),
      ).toThrow("values not part of the choice");
    });
  });

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Drawing Cards Activity
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("drawingCards activity", () => {
    it("moves drawn card from deck to hand", () => {
      const game = buildBasicGame();
      let numCardsInHand = game.cards.filter(
        (c) => c.location.type === "inHand",
      );
      expect(numCardsInHand.length).toBe(0);
      const result = makeDecision({
        gameData: game,
        decision: {
          name: "deck",
          playerId: "alice",
          values: game.activity.currentChoice.values.slice(0, 1),
        },
      });
      numCardsInHand = result.cards.filter((c) => c.location.type === "inHand");
      expect(numCardsInHand.length).toBe(1);
    });

    it("repeats drawingCards on first turn until opening hand is full", () => {
      let game = buildBasicGame();
      game = makeDecision({
        gameData: game,
        decision: {
          name: "deck",
          playerId: "alice",
          values: game.activity.currentChoice.values.slice(0, 1),
        },
      });
      // Should still be drawing cards (opening hand needs 5 cards, only have 1)
      expect(game.activity.type).toBe("drawingCards");
    });

    it("transitions to choosingAction after opening hand drawn", () => {
      let game = buildBasicGame();
      // Draw cards until activity changes from drawingCards (opening hand filled or deck empty)
      while (game.activity.type === "drawingCards") {
        game = makeDecision({
          gameData: game,
          decision: {
            name: game.activity.currentChoice.name,
            playerId: "alice",
            values: game.activity.currentChoice.values.slice(0, 1),
          },
        });
      }
      // Should transition to choosingAction once opening hand is filled
      expect(game.activity.type).toBe("choosingAction");
    });

    it("unexhausts all player's cards during drawingCards trigger", () => {
      // Set up a game where alice has an exhausted card and is drawing
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c1",
          owner: "alice",
          name: testCards.dummyProducer.name,
          location: { type: "inPlay", exhausted: true },
        })
        .addCard({
          id: "c2",
          owner: "alice",
          name: testCards.dummyConsumer.name,
          location: { type: "inDeck" },
        })
        .addChipsInReserve("alice", 5)
        .addChipsInReserve("bob", 5)
        .setPlayerTakingTurn("alice")
        .setActivity({
          type: "drawingCards",
          currentChoice: {
            name: "cardsToDraw",
            type: "cardId",
            values: ["c2"],
            min: 1,
            max: 1,
            choosingPlayerId: "alice",
            instructions: "Draw.",
          },
          nextChoices: [],
          previousDecisions: [],
        })
        .build();
      // Set turnCount > 0 so it doesn't try to draw opening hand
      const alice = game.players.find((p) => p.id === "alice");
      if (alice) alice.turnCount = 1;

      const result = makeDecision({
        gameData: game,
        decision: {
          name: "cardsToDraw",
          playerId: "alice",
          values: ["c2"],
        },
      });

      const c1 = result.cards.find((c) => c.id === "c1");
      expect(c1?.location).toEqual({ type: "inPlay", exhausted: false });
    });
  });

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Choosing Action Activity
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("choosingAction activity", () => {
    it("passing turn transitions to next player's drawingCards", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c1",
          owner: "alice",
          name: testCards.dummyProducer.name,
          location: { type: "inHand" },
        })
        .addCard({
          id: "c2",
          owner: "bob",
          name: testCards.dummyProducer.name,
          location: { type: "inDeck" },
        })
        .addChipsInReserve("alice", 5)
        .addChipsInReserve("bob", 5)
        .setPlayerTakingTurn("alice")
        .setActivity({
          type: "choosingAction",
          playerChoosingActionId: "alice",
          currentChoice: {
            name: "actionToTake",
            type: "actionId",
            choosingPlayerId: "alice",
            instructions: "Choose an action.",
            values: [],
            min: 0,
            max: 1,
          },
          nextChoices: [],
          previousDecisions: [],
        })
        .build();

      const result = makeDecision({
        gameData: game,
        decision: {
          name: "actionToTake",
          playerId: "alice",
          values: [], // passing
        },
      });

      expect(result.activity.type).toBe("drawingCards");
      expect(result.playerTakingTurnId).toBe("bob");
    });

    it("choosing an action transitions to takingAction", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c1",
          owner: "alice",
          name: testCards.basicProducer.name,
          location: { type: "inHand" },
          actionIdMap: { play: "c1-play" },
        })
        .addChipsInReserve("alice", 5)
        .addChipsInReserve("bob", 5)
        .setPlayerTakingTurn("alice")
        .setUpActionActivity("c1-play")
        .build();

      const result = makeDecision({
        gameData: game,
        decision: {
          name: "actionToTake",
          playerId: "alice",
          values: ["c1-play"],
        },
      });

      // basicProducer play has no sequence, so it auto-resolves through
      // takingAction (null choice) back to choosingAction
      expect(result.activity.type).toBe("choosingAction");

      // The card should now be in play
      const c1 = result.cards.find((c) => c.id === "c1");
      expect(c1?.location.type).toBe("inPlay");
    });
  });

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Taking Action Activity
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("takingAction activity", () => {
    it("exhausts card when using ability", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c1",
          owner: "alice",
          name: testCards.producerWithChipAbility.name,
          location: { type: "inPlay", exhausted: false },
          actionIdMap: { ability: "c1-ability" },
        })
        .addChipsInReserve("alice", 5)
        .addChipsInReserve("bob", 5)
        .setPlayerTakingTurn("alice")
        .setUpActionActivity("c1-ability")
        .build();

      // Choose the action.
      let result = makeDecision({
        gameData: game,
        decision: {
          name: game.activity.currentChoice.name,
          playerId: "alice",
          values: ["c1-ability"],
        },
      });

      const chipToMove = game.chips.find(
        (c) => c.ownerId === "alice" && c.location.type === "inReserve",
      );

      result = makeDecision({
        gameData: result,
        decision: {
          name: "targetChips",
          playerId: "alice",
          values: [chipToMove?.id ?? ""],
        },
      });

      // Card should be exhausted
      const c1 = result.cards.find((c) => c.id === "c1");
      expect(c1?.location).toEqual({ type: "inPlay", exhausted: true });

      // Chip should be on the card
      const chip = result.chips.find((c) => c.id === chipToMove?.id);
      expect(chip?.location).toEqual({ type: "onCard", cardId: "c1" });

      // Should transition back to choosingAction
      expect(result.activity.type).toBe("choosingAction");
    });

    it("transitions to another player when action passes turn in 2-player game", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c1",
          owner: "alice",
          name: testCards.producerThatPassesTurn.name,
          location: { type: "inPlay", exhausted: false },
          actionIdMap: { ability: "c1-ability" },
        })
        .addChipsInReserve("alice", 5)
        .addChipsInReserve("bob", 5)
        .setPlayerTakingTurn("alice")
        .setUpActionActivity("c1-ability")
        .build();

      // Alice takes the action that passes the turn.
      let result = makeDecision({
        gameData: game,
        decision: {
          playerId: "alice",
          name: "actionToTake",
          values: ["c1-ability"],
        },
      });

      // The action should exhaust the card.
      const card = result.cards.find((c) => c.id === "c1");
      expect(card?.location.type).toBe("inPlay");
      if (card?.location.type === "inPlay") {
        expect(card.location.exhausted).toBe(true);
      }

      // The action should have passed the turn to Bob.
      expect(result.playerTakingTurnId).toBe("bob");
      expect(result.activity.type).toBe("drawingCards");

      // Bob concludes "drawingCards" activity.
      result = makeDecision({
        gameData: result,
        decision: {
          playerId: "bob",
          name: result.activity.currentChoice.name,
          values: [],
        },
      });

      // Bob passes his turn (chooses no action).
      expect(result.activity.type).toBe("choosingAction");
      result = makeDecision({
        gameData: result,
        decision: {
          playerId: "bob",
          name: result.activity.currentChoice.name,
          values: [],
        },
      });

      // Should cycle back to alice.
      expect(result.playerTakingTurnId).toBe("alice");
      expect(result.activity.type).toBe("drawingCards");
    });

    it("transitions to another player when action passes turn in 3-player game", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addPlayer("charlie")
        .addCard({
          id: "c1",
          owner: "alice",
          name: testCards.producerThatPassesTurn.name,
          location: { type: "inPlay", exhausted: false },
          actionIdMap: { ability: "c1-ability" },
        })
        .addChipsInReserve("alice", 5)
        .addChipsInReserve("bob", 5)
        .addChipsInReserve("charlie", 5)
        .setPlayerTakingTurn("alice")
        .setUpActionActivity("c1-ability")
        .build();

      // Alice's ability passes the turn to Bob.
      let result = makeDecision({
        gameData: game,
        decision: {
          playerId: "alice",
          name: game.activity.currentChoice.name,
          values: ["c1-ability"],
        },
      });

      expect(result.playerTakingTurnId).toBe("bob");

      // Bob draws and then passes.
      result = makeDecision({
        gameData: result,
        decision: {
          playerId: "bob",
          name: result.activity.currentChoice.name,
          values: [],
        },
      });
      result = makeDecision({
        gameData: result,
        decision: {
          playerId: "bob",
          name: result.activity.currentChoice.name,
          values: [],
        },
      });

      // Should go to charlie, not back to alice.
      expect(result.playerTakingTurnId).toBe("charlie");
    });
  });

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Triggers
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("triggers", () => {
    it("discards consumer with no chips after activity", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c-prod",
          owner: "alice",
          name: testCards.dummyProducer.name,
          location: { type: "inPlay", exhausted: false },
        })
        .addCard({
          id: "c-cons",
          owner: "alice",
          name: testCards.consumerWithTwoStepAbility.name,
          location: { type: "inPlay", exhausted: false },
          actionIdMap: { ability: "c-cons-ability" },
        })
        .addChip({
          id: "ch1",
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons" },
        })
        .addChipsInReserve("alice", 4)
        .addChipsInReserve("bob", 5)
        .setPlayerTakingTurn("alice")
        .setUpActionActivity("c-cons-ability")
        .build();

      // Choose the action.
      let result = makeDecision({
        gameData: game,
        decision: {
          name: game.activity.currentChoice.name,
          playerId: "alice",
          values: ["c-cons-ability"],
        },
      });

      // Choose the producer card.
      result = makeDecision({
        gameData: result,
        decision: {
          name: "targetCard",
          playerId: "alice",
          values: ["c-prod"],
        },
      });

      // Second decision: choose the chip to move
      expect(result.activity.type).toBe("takingAction");
      result = makeDecision({
        gameData: result,
        decision: {
          name: "targetChips",
          playerId: "alice",
          values: ["ch1"],
        },
      });

      // Consumer should be discarded (no chips left on it)
      const consumer = result.cards.find((c) => c.id === "c-cons");
      expect(consumer?.location.type).toBe("inDiscard");

      // Chip should be on the producer
      const chip = result.chips.find((c) => c.id === "ch1");
      expect(chip?.location).toEqual({ type: "onCard", cardId: "c-prod" });
    });

    it("producer with trigger discards when last chip removed", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c-dying",
          owner: "alice",
          name: testCards.producerThatCanDie.name,
          location: { type: "inPlay", exhausted: false },
          actionIdMap: { ability: "c-dying-ability" },
        })
        .addCard({
          id: "c-cons",
          owner: "alice",
          name: testCards.consumerWithTwoStepAbility.name,
          location: { type: "inPlay", exhausted: false },
        })
        .addChip({
          id: "ch1",
          owner: "alice",
          location: { type: "onCard", cardId: "c-dying" },
        })
        .addChip({
          id: "ch2",
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons" },
        })
        .addChipsInReserve("alice", 3)
        .addChipsInReserve("bob", 5)
        .setUpActionActivity("c-dying-ability")
        .setPlayerTakingTurn("alice")
        .build();

      // Choose the ability.
      const result = makeDecision({
        gameData: game,
        decision: {
          name: game.activity.currentChoice.name,
          playerId: "alice",
          values: ["c-dying-ability"],
        },
      });

      // Choose target card with auto-decision off.
      let manualResult = makeDecision({
        gameData: result,
        decision: {
          name: "targetCard",
          playerId: "alice",
          values: ["c-cons"],
        },
      });
      // Choose chip manually.
      manualResult = makeDecision({
        gameData: manualResult,
        decision: {
          name: "targetChips",
          playerId: "alice",
          values: ["ch1"],
        },
      });

      // Choose card with auto-decision on. (Should choose chip automatically.)
      const autoResult = makeDecision({
        gameData: result,
        decision: {
          name: "targetCard",
          playerId: "alice",
          values: ["c-cons"],
        },
        autoDecide: true,
      });

      // The dying producer should be discarded in both cases.
      const dyingProdManual = manualResult.cards.find(
        (c) => c.id === "c-dying",
      );
      expect(dyingProdManual?.location.type).toBe("inDiscard");

      const dyingProdAuto = autoResult.cards.find((c) => c.id === "c-dying");
      expect(dyingProdAuto?.location.type).toBe("inDiscard");
    });
  });

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Tick Management
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("tick management", () => {
    it("increments tick on each decision", () => {
      const game = buildBasicGame();
      expect(game.tick).toBe(0);
      const result = makeDecision({
        gameData: game,
        decision: {
          name: "deck",
          playerId: "alice",
          values: game.activity.currentChoice.values.slice(0, 1),
        },
      });
      expect(result.tick).toBe(1);
    });
  });

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Automatic Decisionmaking
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("automatic decision", () => {
    it("automatically chooses chips from homogeneous pools", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "recipient-id",
          name: testCards.producerWithChipChoices.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: false },
          actionIdMap: { ability: "action-id" },
        })
        // Only one donor makes the "other cards" pool homogeneous.
        .addCard({
          id: "donor-id",
          name: testCards.dummyProducer.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: false },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "donor-id" },
        })
        // Having no chips in channel makes the "channel or reserve" pool
        // homogeneous.
        .addChipsInReserve("alice", 3)
        .addChipsInReserve("bob", 3)
        .setPlayerTakingTurn("alice")
        .setUpActionActivity("action-id")
        .build();

      const result = makeDecision({
        gameData: game,
        decision: {
          name: "actionToTake",
          playerId: "alice",
          values: ["action-id"],
        },
        autoDecide: true,
      });

      // Since the action's choices can be made automatically, the next
      // activity should be "choosingAction".
      expect(result.activity.type).toBe("choosingAction");

      const chips = new Accessor(result).getChips({
        cardIds: ["recipient-id"],
      });
      expect(chips.length).toBe(2);
    });

    it("is not active by default", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "recipient-id",
          name: testCards.producerWithChipChoices.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: false },
          actionIdMap: { ability: "action-id" },
        })
        .addCard({
          id: "donor-id",
          name: testCards.dummyProducer.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: false },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "donor-id" },
        })
        .addChipsInReserve("alice", 3)
        .addChipsInReserve("bob", 3)
        .setPlayerTakingTurn("alice")
        .setUpActionActivity("action-id")
        .build();

      const result = makeDecision({
        gameData: game,
        decision: {
          name: "actionToTake",
          playerId: "alice",
          values: ["action-id"],
        },
        autoDecide: false,
      });

      expect(result.activity.type).toBe("takingAction");
      expect(result.activity.nextChoices.length).toBe(1);
    });

    it("cannot choose chips automatically from multiple cards", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "recipient-id",
          name: testCards.producerWithChipChoices.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: false },
          actionIdMap: { ability: "action-id" },
        })
        // Adding multiple donor cards makes the "other cards" pool heterogeneous.
        .addCard({
          id: "donor-1-id",
          name: testCards.dummyProducer.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: false },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "donor-1-id" },
        })
        .addCard({
          id: "donor-2-id",
          name: testCards.dummyProducer.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: false },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "donor-2-id" },
        })
        .addChipsInReserve("alice", 3)
        .addChipsInReserve("bob", 3)
        .setPlayerTakingTurn("alice")
        .setUpActionActivity("action-id")
        .build();

      const result = makeDecision({
        gameData: game,
        decision: {
          name: "actionToTake",
          playerId: "alice",
          values: ["action-id"],
        },
        autoDecide: true,
      });

      // Since the second choice cannot be made automatically, the next
      // activity should be "takingAction", and there should be one choice
      // left.
      expect(result.activity.type).toBe("takingAction");
      expect(result.activity.nextChoices.length).toBe(0);
    });

    it("cannot choose chips automatically from heterogeneous pools", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "recipient-id",
          name: testCards.producerWithChipChoices.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: false },
          actionIdMap: { ability: "action-id" },
        })
        // Adding multiple donor cards makes the "other cards" pool heterogeneous.
        .addCard({
          id: "donor-id",
          name: testCards.dummyProducer.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: false },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "donor-id" },
        })
        // Adding a chip to Alice's channel makes the "channel or reserve" pool
        // heterogeneous.
        .addChip({
          id: "channel-chip-id",
          owner: "alice",
          location: { type: "inChannel" },
        })
        .addChipsInReserve("alice", 3)
        .addChipsInReserve("bob", 3)
        .setPlayerTakingTurn("alice")
        .setUpActionActivity("action-id")
        .build();

      let result = makeDecision({
        gameData: game,
        decision: {
          name: "actionToTake",
          playerId: "alice",
          values: ["action-id"],
        },
        autoDecide: true,
      });

      // Since the first choice cannot be made automatically, the next
      // activity should be "takingAction", and there should be two choices
      // left (current + next).
      expect(result.activity.type).toBe("takingAction");
      expect(result.activity.nextChoices.length).toBe(1);

      result = makeDecision({
        gameData: result,
        decision: {
          name: "chips",
          playerId: "alice",
          values: ["channel-chip-id"],
        },
        autoDecide: true,
      });

      // Since the second choice can be made automatically, the action should
      // be concluded, and the next activity should be "choosingAction".
      expect(result.activity.type).toBe("choosingAction");

      const chips = new Accessor(result).getChips({
        cardIds: ["recipient-id"],
      });
      expect(chips.length).toBe(2);
    });
  });

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Annotations
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("annotations", () => {
    it("annotates actions that cannot be taken when card is in play", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c1",
          name: testCards.basicProducer.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: false },
          actionIdMap: { play: "c1-play" },
        })
        .setActivity({
          type: "drawingCards",
          currentChoice: {
            type: "arbitrary",
            name: "foobar",
            values: [],
            min: 0,
            max: 1,
            choosingPlayerId: "alice",
            instructions: "",
          },
          nextChoices: [],
          previousDecisions: [],
        })
        .setPlayerTakingTurn("alice")
        .build();

      // Draw no cards from empty deck.
      const result = makeDecision({
        gameData: game,
        decision: {
          playerId: "alice",
          name: game.activity.currentChoice.name,
          values: [],
        },
      });

      const annotatedIds = result.annotations.map((a) => a.id);
      expect(annotatedIds).toContain("c1-play");
    });

    it("annotates actions that cannot be taken from the player's hand", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c1",
          name: testCards.basicProducer.name,
          owner: "alice",
          location: { type: "inHand" },
          actionIdMap: { ability: "c1-ability", discard: "c1-discard" },
        })
        .setActivity({
          type: "drawingCards",
          currentChoice: {
            type: "arbitrary",
            name: "foobar",
            values: [],
            min: 0,
            max: 1,
            choosingPlayerId: "alice",
            instructions: "",
          },
          nextChoices: [],
          previousDecisions: [],
        })
        .setPlayerTakingTurn("alice")
        .build();

      // Draw no cards from empty deck.
      const result = makeDecision({
        gameData: game,
        decision: {
          playerId: "alice",
          name: game.activity.currentChoice.name,
          values: [],
        },
      });

      const annotatedIds = result.annotations.map((a) => a.id);
      expect(annotatedIds).toContain("c1-ability");
      expect(annotatedIds).toContain("c1-discard");
    });

    it("annotates actions that cannot be taken from exhausted card", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c1",
          name: testCards.producerWithTrivialActions.name,
          owner: "alice",
          location: { type: "inPlay", exhausted: true },
          actionIdMap: { ability: "c1-ability", discard: "c1-discard" },
        })
        .setUpActionActivity("c1-ability")
        .setPlayerTakingTurn("alice")
        .build();

      // Choose the action. Should resolve immediately, and exhaust the card.
      const result = makeDecision({
        gameData: game,
        decision: {
          playerId: "alice",
          name: game.activity.currentChoice.name,
          values: ["c1-ability"],
        },
      });

      const annotatedIds = result.annotations.map((a) => a.id);
      expect(annotatedIds).toContain("c1-ability");
      expect(annotatedIds).toContain("c1-discard");
    });
  });
});
