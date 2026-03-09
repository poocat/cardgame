import {
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { Accessor } from "@server/game/runtime/Accessor";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testCards } from "../../../fixtures/cards";
import { GameBuilder } from "../../../helpers/GameBuilder";

beforeAll(() => {
  extendCardRegistry({ cards: Object.values(testCards) });
});

afterAll(() => {
  resetCardRegistry();
});

function buildTestGame() {
  return (
    new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      // Alice's cards
      .addCard({
        id: "c1",
        owner: "alice",
        name: testCards.basicProducer.name, // Has actions for getActionById test
        location: { type: "inHand" },
      })
      .addCard({
        id: "c2",
        owner: "alice",
        name: testCards.dummyConsumer.name,
        location: { type: "inPlay", exhausted: false },
      })
      .addCard({
        id: "c3",
        owner: "alice",
        name: testCards.dummyProducer.name,
        location: { type: "inPlay", exhausted: true },
      })
      .addCard({
        id: "c4",
        owner: "alice",
        name: testCards.dummyProducer.name,
        location: { type: "inDeck" },
      })
      // Bob's cards
      .addCard({
        id: "c5",
        owner: "bob",
        name: testCards.dummyProducer.name,
        location: { type: "inPlay", exhausted: false },
      })
      .addCard({
        id: "c6",
        owner: "bob",
        name: testCards.dummyConsumer.name,
        location: { type: "inDiscard" },
      })
      // Chips
      .addChip({ id: "ch1", owner: "alice", location: { type: "inReserve" } })
      .addChip({ id: "ch2", owner: "alice", location: { type: "inReserve" } })
      .addChip({
        id: "ch3",
        owner: "alice",
        location: { type: "onCard", cardId: "c2" },
      })
      .addChip({
        id: "ch4",
        owner: "bob",
        location: { type: "onCard", cardId: "c5" },
      })
      .addChip({ id: "ch5", owner: "bob", location: { type: "inReserve" } })
      .setPlayerTakingTurn("alice")
      .build()
  );
}

describe("Accessor", () => {
  describe("getPlayerTakingTurn", () => {
    it("returns the player whose turn it is", () => {
      const game = buildTestGame();
      const accessor = new Accessor(game);
      expect(accessor.getPlayerTakingTurn().id).toBe("alice");
    });
  });

  describe("getCardById", () => {
    it("returns the card with the given id", () => {
      const accessor = new Accessor(buildTestGame());
      const card = accessor.getCardById({ cardId: "c1" });
      expect(card.name).toBe(testCards.basicProducer.name);
      expect(card.ownerId).toBe("alice");
    });

    it("throws when card not found", () => {
      const accessor = new Accessor(buildTestGame());
      expect(() => accessor.getCardById({ cardId: "nonexistent" })).toThrow();
    });
  });

  describe("getActionById", () => {
    it("returns the action with the given id", () => {
      const game = buildTestGame();
      const accessor = new Accessor(game);
      const action = accessor.getActionById({ actionId: game.actions[0].id });
      expect(action).toBeDefined();
    });

    it("throws when action not found", () => {
      const accessor = new Accessor(buildTestGame());
      expect(() =>
        accessor.getActionById({ actionId: "nonexistent" }),
      ).toThrow();
    });
  });

  describe("getCards", () => {
    it("filters by playerIds", () => {
      const accessor = new Accessor(buildTestGame());
      const cards = accessor.getCards({ playerIds: ["alice"] });
      expect(cards).toHaveLength(4);
      expect(cards.every((c) => c.ownerId === "alice")).toBe(true);
    });

    it("filters by types", () => {
      const accessor = new Accessor(buildTestGame());
      const producers = accessor.getCards({ types: ["producer"] });
      expect(producers.every((c) => c.type === "producer")).toBe(true);
      expect(producers.length).toBeGreaterThan(0);
    });

    it("filters by locationTypes", () => {
      const accessor = new Accessor(buildTestGame());
      const inPlay = accessor.getCards({ locationTypes: ["inPlay"] });
      expect(inPlay.every((c) => c.location.type === "inPlay")).toBe(true);
      expect(inPlay).toHaveLength(3); // c2, c3, c5
    });

    it("filters by exhausted (only applies to inPlay cards)", () => {
      const accessor = new Accessor(buildTestGame());
      // exhausted filter only excludes inPlay cards with wrong exhaustion state;
      // cards not inPlay pass through the exhausted check.
      const exhausted = accessor.getCards({
        exhausted: true,
        locationTypes: ["inPlay"],
      });
      expect(exhausted).toHaveLength(1);
      expect(exhausted[0].id).toBe("c3");
    });

    it("filters by minChips", () => {
      const accessor = new Accessor(buildTestGame());
      const withChips = accessor.getCards({ minChips: 1 });
      expect(withChips.map((c) => c.id).sort()).toEqual(["c2", "c5"]);
    });

    it("filters by maxChips", () => {
      const accessor = new Accessor(buildTestGame());
      const noChips = accessor.getCards({ maxChips: 0 });
      expect(noChips.every((c) => c.id !== "c2" && c.id !== "c5")).toBe(true);
    });

    it("filters by excludeIds", () => {
      const accessor = new Accessor(buildTestGame());
      const all = accessor.getCards({});
      const excluded = accessor.getCards({ excludeIds: ["c1", "c2"] });
      expect(excluded).toHaveLength(all.length - 2);
      expect(excluded.find((c) => c.id === "c1")).toBeUndefined();
    });

    it("combines multiple filters", () => {
      const accessor = new Accessor(buildTestGame());
      const result = accessor.getCards({
        playerIds: ["alice"],
        locationTypes: ["inPlay"],
        types: ["producer"],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("c3");
    });
  });

  describe("getChips", () => {
    it("returns chips on the specified card", () => {
      const accessor = new Accessor(buildTestGame());
      const chips = accessor.getChips({ cardIds: ["c2"] });
      expect(chips).toHaveLength(1);
      expect(chips[0].id).toBe("ch3");
    });

    it("returns empty array when no chips on card", () => {
      const accessor = new Accessor(buildTestGame());
      expect(accessor.getChips({ cardIds: ["c1"] })).toHaveLength(0);
    });

    it("returns chips in player's reserve", () => {
      const accessor = new Accessor(buildTestGame());
      const chips = accessor.getChips({
        playerIds: ["alice"],
        locationTypes: ["inReserve"],
      });
      expect(chips).toHaveLength(2);
      expect(chips.map((c) => c.id).sort()).toEqual(["ch1", "ch2"]);
    });

    it("returns empty array when player has no chips in reserve", () => {
      const game = new GameBuilder()
        .addPlayer("charlie")
        .addChip({
          id: "x",
          owner: "charlie",
          location: { type: "onCard", cardId: "whatever" },
        })
        .build();
      const accessor = new Accessor(game);
      expect(
        accessor.getChips({
          playerIds: ["charlie"],
          locationTypes: ["inReserve"],
        }),
      ).toHaveLength(0);
    });
  });
});
