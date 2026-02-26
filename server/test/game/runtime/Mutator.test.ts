import {
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { Mutator } from "@server/game/runtime/Mutator";
import type { ActivityData } from "@server/types";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testCards } from "../../fixtures/cards";
import { GameBuilder } from "../../helpers/GameBuilder";

beforeAll(() => {
  extendCardRegistry({ cards: Object.values(testCards) });
});

afterAll(() => {
  resetCardRegistry();
});

function buildTestGame() {
  return new GameBuilder()
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
      owner: "alice",
      name: testCards.dummyConsumer.name,
      location: { type: "inPlay", exhausted: false },
    })
    .addChip({ id: "ch1", owner: "alice", location: { type: "inReserve" } })
    .addChip({
      id: "ch2",
      owner: "alice",
      location: { type: "onCard", cardId: "c2" },
    })
    .setPlayerTakingTurn("alice")
    .setTick(5)
    .setTurn(3)
    .build();
}

describe("Mutator", () => {
  describe("moveCard", () => {
    it("updates card location", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      mutator.moveCard({
        id: "c1",
        location: { type: "inPlay", exhausted: false },
      });
      const card = game.cards.find((c) => c.id === "c1");
      expect(card?.location).toEqual({ type: "inPlay", exhausted: false });
    });

    it("updates lastMovedOnTick and lastMovedOnTurn", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      mutator.moveCard({
        id: "c1",
        location: { type: "inPlay", exhausted: false },
      });
      const card = game.cards.find((c) => c.id === "c1");
      expect(card?.lastMovedOnTick).toBe(5);
      expect(card?.lastMovedOnTurn).toBe(3);
    });

    it("throws when card not found", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      expect(() =>
        mutator.moveCard({ id: "nonexistent", location: { type: "inHand" } }),
      ).toThrow();
    });

    it("moves card to front of array when moved to deck", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      // c2 is at index 1
      mutator.moveCard({ id: "c2", location: { type: "inDeck" } });
      expect(game.cards[0].id).toBe("c2");
    });
  });

  describe("moveChips", () => {
    it("updates chip locations", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      mutator.moveChips({
        ids: ["ch1"],
        location: { type: "onCard", cardId: "c2" },
      });
      const chip = game.chips.find((c) => c.id === "ch1");
      expect(chip?.location).toEqual({ type: "onCard", cardId: "c2" });
    });

    it("moves multiple chips at once", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      mutator.moveChips({
        ids: ["ch1", "ch2"],
        location: { type: "inReserve" },
      });
      game.chips.forEach((c) => {
        expect(c.location.type).toBe("inReserve");
      });
    });
  });

  describe("exhaustCard", () => {
    it("sets exhausted flag on a card in play", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      mutator.exhaustCard({ id: "c2", value: true });
      const card = game.cards.find((c) => c.id === "c2");
      expect(card?.location).toEqual({ type: "inPlay", exhausted: true });
    });

    it("throws when card not found", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      expect(() =>
        mutator.exhaustCard({ id: "nonexistent", value: true }),
      ).toThrow();
    });

    it("does nothing for cards not in play", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      // c1 is inHand — exhaustCard should not throw but also not change location
      mutator.exhaustCard({ id: "c1", value: true });
      const card = game.cards.find((c) => c.id === "c1");
      expect(card?.location.type).toBe("inHand");
    });
  });

  describe("passTurn", () => {
    it("increments the outgoing player's turnCount", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      mutator.passTurn({ from: "alice", to: "bob" });
      const alice = game.players.find((p) => p.id === "alice");
      expect(alice?.turnCount).toBe(1);
    });

    it("updates playerTakingTurnId", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      mutator.passTurn({ from: "alice", to: "bob" });
      expect(game.playerTakingTurnId).toBe("bob");
    });

    it("increments turn counter", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      mutator.passTurn({ from: "alice", to: "bob" });
      expect(game.turn).toBe(4);
    });

    it("throws when from player not found", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      expect(() =>
        mutator.passTurn({ from: "nonexistent", to: "bob" }),
      ).toThrow();
    });
  });

  describe("setActivity", () => {
    it("replaces the current activity", () => {
      const game = buildTestGame();
      const mutator = new Mutator(game);
      const newActivity: ActivityData = {
        type: "drawingCards",
        currentChoice: {
          name: "deck",
          type: "deck",
          values: [""],
          min: 1,
          max: 1,
          choosingPlayerId: "alice",
          instructions: "Draw a card.",
        },
        nextChoices: [],
        previousDecisions: [],
      };
      mutator.setActivity({ activity: newActivity });
      expect(game.activity.type).toBe("drawingCards");
    });
  });
});
