import {
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { makeDecision } from "@server/game/stateMachine";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testCards } from "../fixtures/cards";
import {
  buildBasicGame,
  findActionId,
  GameBuilder,
} from "../helpers/GameBuilder";

beforeAll(() => {
  extendCardRegistry({ cards: Object.values(testCards) });
});

afterAll(() => {
  resetCardRegistry();
});

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
            name: "cardToDraw",
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
            name: "cardToDraw",
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
            name: "cardToDraw",
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
            name: "cardToDraw",
            playerId: "alice",
            values: ["nonexistent-card-id"],
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
      const cardId = game.activity.currentChoice.values[0];
      const result = makeDecision({
        gameData: game,
        decision: {
          name: "cardToDraw",
          playerId: "alice",
          values: [cardId],
        },
      });
      const card = result.cards.find((c) => c.id === cardId);
      expect(card?.location.type).toBe("inHand");
    });

    it("repeats drawingCards on first turn until opening hand is full", () => {
      let game = buildBasicGame();
      // First turn, draw card — should stay in drawingCards
      const cardId = game.activity.currentChoice.values[0];
      game = makeDecision({
        gameData: game,
        decision: {
          name: "cardToDraw",
          playerId: "alice",
          values: [cardId],
        },
      });
      // Should still be drawing cards (opening hand needs 5 cards, only have 1)
      expect(game.activity.type).toBe("drawingCards");
    });

    it("transitions to choosingAction after opening hand drawn", () => {
      let game = buildBasicGame();
      // Draw cards until activity changes from drawingCards (opening hand filled or deck empty)
      while (game.activity.type === "drawingCards") {
        const cardId = game.activity.currentChoice.values[0];
        if (!cardId) break;
        game = makeDecision({
          gameData: game,
          decision: {
            name: game.activity.currentChoice.name,
            playerId: "alice",
            values: [cardId],
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
        })
        .addChipsInReserve("alice", 5)
        .addChipsInReserve("bob", 5)
        .setPlayerTakingTurn("alice")
        .build();

      const playActionId = findActionId(game, "c1", "play");

      // Set up choosingAction with the play action available
      game.activity = {
        type: "choosingAction",
        playerChoosingActionId: "alice",
        currentChoice: {
          name: "actionToTake",
          type: "actionId",
          choosingPlayerId: "alice",
          instructions: "Choose an action.",
          values: [playActionId],
          min: 0,
          max: 1,
        },
        nextChoices: [],
        previousDecisions: [],
      };

      const result = makeDecision({
        gameData: game,
        decision: {
          name: "actionToTake",
          playerId: "alice",
          values: [playActionId],
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
        })
        .addChipsInReserve("alice", 5)
        .addChipsInReserve("bob", 5)
        .setPlayerTakingTurn("alice")
        .build();

      const abilityActionId = findActionId(game, "c1", "ability");

      // Set up takingAction for the ability
      game.activity = {
        type: "takingAction",
        actionId: abilityActionId,
        playerTakingActionId: "alice",
        currentChoice: {
          name: "targetChips",
          type: "chipId",
          choosingPlayerId: "alice",
          instructions: "Move up to one chip from your reserve to this card.",
          values: game.chips
            .filter(
              (c) => c.ownerId === "alice" && c.location.type === "inReserve",
            )
            .map((c) => c.id),
          min: 0,
          max: 1,
        },
        nextChoices: [],
        previousDecisions: [],
      };

      const chipToMove = game.chips.find(
        (c) => c.ownerId === "alice" && c.location.type === "inReserve",
      );

      const result = makeDecision({
        gameData: game,
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
        })
        .addChip({
          id: "ch1",
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons" },
        })
        .addChipsInReserve("alice", 4)
        .addChipsInReserve("bob", 5)
        .setPlayerTakingTurn("alice")
        .build();

      const abilityActionId = findActionId(game, "c-cons", "ability");

      // Consumer ability: move chip from consumer to a producer
      game.activity = {
        type: "takingAction",
        actionId: abilityActionId,
        playerTakingActionId: "alice",
        currentChoice: {
          name: "targetCard",
          type: "cardId",
          choosingPlayerId: "alice",
          instructions: "Choose one of your producer cards.",
          values: ["c-prod"],
          min: 1,
          max: 1,
        },
        nextChoices: [{ type: "dependent", index: 1 }],
        previousDecisions: [],
      };

      // First decision: choose the producer card
      let result = makeDecision({
        gameData: game,
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
        .setPlayerTakingTurn("alice")
        .build();

      const abilityActionId = findActionId(game, "c-dying", "ability");

      // Dying producer's ability: move chip from this card to a consumer
      game.activity = {
        type: "takingAction",
        actionId: abilityActionId,
        playerTakingActionId: "alice",
        currentChoice: {
          name: "targetCard",
          type: "cardId",
          choosingPlayerId: "alice",
          instructions: "Choose one of your consumer cards.",
          values: ["c-cons"],
          min: 1,
          max: 1,
        },
        nextChoices: [{ type: "dependent", index: 1 }],
        previousDecisions: [],
      };

      // First decision: choose target card
      let result = makeDecision({
        gameData: game,
        decision: {
          name: "targetCard",
          playerId: "alice",
          values: ["c-cons"],
        },
      });

      // Second decision: choose chip
      result = makeDecision({
        gameData: result,
        decision: {
          name: "targetChips",
          playerId: "alice",
          values: ["ch1"],
        },
      });

      // The dying producer should be discarded
      const dyingProd = result.cards.find((c) => c.id === "c-dying");
      expect(dyingProd?.location.type).toBe("inDiscard");
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
          name: "cardToDraw",
          playerId: "alice",
          values: [game.activity.currentChoice.values[0]],
        },
      });
      expect(result.tick).toBe(1);
    });
  });
});
