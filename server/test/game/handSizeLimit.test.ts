import { CONSTANTS } from "@common/game/constants";
import {
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { createDrawingCardsChoice } from "@server/game/rules/transitions/choices";
import { Accessor } from "@server/game/runtime";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testCards } from "../fixtures/cards";
import { GameBuilder } from "../helpers/GameBuilder";

beforeAll(() => {
  extendCardRegistry({ cards: Object.values(testCards) });
});

afterAll(() => {
  resetCardRegistry();
});

describe("hand size limit", () => {
  it("offers no draw options when hand is at the limit", () => {
    const builder = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .setPlayerTakingTurn("alice");

    // Fill alice's hand to the limit.
    for (let i = 0; i < CONSTANTS.maxNumCardsInHand; i++) {
      builder.addCard({
        owner: "alice",
        name: testCards.dummyProducer.name,
        location: { type: "inHand" },
      });
    }

    // Cards in deck that would normally be drawable.
    builder.addCard({
      owner: "alice",
      name: testCards.dummyProducer.name,
      location: { type: "inDeck" },
    });
    builder.addCard({
      owner: "alice",
      name: testCards.dummyConsumer.name,
      location: { type: "inDeck" },
    });

    const game = builder.build();
    const accessor = new Accessor(game);
    const choice = createDrawingCardsChoice({
      playerId: "alice",
      accessor,
    });

    expect(choice.values).toHaveLength(0);
    expect(choice.min).toBe(0);
  });

  it("offers draw options when hand is below the limit", () => {
    const builder = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .setPlayerTakingTurn("alice");

    // One fewer than the limit.
    for (let i = 0; i < CONSTANTS.maxNumCardsInHand - 1; i++) {
      builder.addCard({
        owner: "alice",
        name: testCards.dummyProducer.name,
        location: { type: "inHand" },
      });
    }

    builder.addCard({
      owner: "alice",
      name: testCards.dummyProducer.name,
      location: { type: "inDeck" },
    });
    builder.addCard({
      owner: "alice",
      name: testCards.dummyConsumer.name,
      location: { type: "inDeck" },
    });

    const game = builder.build();
    const accessor = new Accessor(game);
    const choice = createDrawingCardsChoice({
      playerId: "alice",
      accessor,
    });

    expect(choice.values).toContain("producer");
    expect(choice.values).toContain("consumer");
    expect(choice.min).toBe(1);
  });

  it("offers no draw options when hand is at the limit even with cards in deck", () => {
    const builder = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .setPlayerTakingTurn("alice");

    for (let i = 0; i < CONSTANTS.maxNumCardsInHand; i++) {
      builder.addCard({
        owner: "alice",
        name: testCards.dummyConsumer.name,
        location: { type: "inHand" },
      });
    }

    // Plenty of cards in deck.
    for (let i = 0; i < 5; i++) {
      builder.addCard({
        owner: "alice",
        name: testCards.dummyProducer.name,
        location: { type: "inDeck" },
      });
    }

    const game = builder.build();
    const accessor = new Accessor(game);
    const choice = createDrawingCardsChoice({
      playerId: "alice",
      accessor,
    });

    expect(choice.values).toHaveLength(0);
    expect(choice.min).toBe(0);
  });

  it("does not count cards in play toward the hand limit", () => {
    const builder = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .setPlayerTakingTurn("alice");

    // Fill hand to one below the limit.
    for (let i = 0; i < CONSTANTS.maxNumCardsInHand - 1; i++) {
      builder.addCard({
        owner: "alice",
        name: testCards.dummyProducer.name,
        location: { type: "inHand" },
      });
    }

    // Additional cards in play should not count toward hand limit.
    for (let i = 0; i < 3; i++) {
      builder.addCard({
        owner: "alice",
        name: testCards.dummyProducer.name,
        location: { type: "inPlay", exhausted: false },
      });
    }

    builder.addCard({
      owner: "alice",
      name: testCards.dummyProducer.name,
      location: { type: "inDeck" },
    });

    const game = builder.build();
    const accessor = new Accessor(game);
    const choice = createDrawingCardsChoice({
      playerId: "alice",
      accessor,
    });

    expect(choice.values).toContain("producer");
    expect(choice.min).toBe(1);
  });

  it("offers only the deck types that have cards remaining", () => {
    const builder = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .setPlayerTakingTurn("alice")
      .addChipsInReserve("alice", 1)
      .addChipsInReserve("bob", 1);

    // Only producers in deck, no consumers.
    builder.addCard({
      owner: "alice",
      name: testCards.dummyProducer.name,
      location: { type: "inDeck" },
    });

    const game = builder.build();
    const accessor = new Accessor(game);
    const choice = createDrawingCardsChoice({
      playerId: "alice",
      accessor,
    });

    expect(choice.values).toContain("producer");
    expect(choice.values).not.toContain("consumer");
  });
});
