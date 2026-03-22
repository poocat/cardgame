import {
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { Mutator } from "@server/game/runtime/Mutator";
import { MutatorQueue } from "@server/game/runtime/MutatorQueue";
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
    .setPlayerTakingTurn("alice")
    .setTick(0)
    .setTurn(0)
    .build();
}

describe("MutatorQueue", () => {
  it("queues operations without applying them", () => {
    const game = buildTestGame();
    const queue = new MutatorQueue();

    queue.moveCard({
      id: "c1",
      location: { type: "inPlay", exhausted: false },
    });

    // Game should be unchanged
    const card = game.cards.find((c) => c.id === "c1");
    expect(card?.location.type).toBe("inHand");
  });

  it("applies all queued operations when apply() is called", () => {
    const game = buildTestGame();
    const queue = new MutatorQueue();

    queue.moveCard({
      id: "c1",
      location: { type: "inPlay", exhausted: false },
    });
    queue.moveChips({
      ids: ["ch1"],
      location: { type: "onCard", cardId: "c1" },
    });
    queue.exhaustCard({ id: "c2", value: true });

    queue.apply(new Mutator(game));

    expect(game.cards.find((c) => c.id === "c1")?.location).toEqual({
      type: "inPlay",
      exhausted: false,
    });
    expect(game.chips.find((c) => c.id === "ch1")?.location).toEqual({
      type: "onCard",
      cardId: "c1",
    });
    expect(game.cards.find((c) => c.id === "c2")?.location).toEqual({
      type: "inPlay",
      exhausted: true,
    });
  });

  it("does not re-apply already-applied operations on subsequent apply() calls", () => {
    const game = buildTestGame();
    const queue = new MutatorQueue();

    // First batch
    queue.moveChips({
      ids: ["ch1"],
      location: { type: "onCard", cardId: "c1" },
    });
    queue.apply(new Mutator(game));

    expect(game.chips.find((c) => c.id === "ch1")?.location).toEqual({
      type: "onCard",
      cardId: "c1",
    });

    // Second batch — only new operations should apply
    queue.moveChips({
      ids: ["ch1"],
      location: { type: "inReserve" },
    });
    queue.apply(new Mutator(game));

    expect(game.chips.find((c) => c.id === "ch1")?.location).toEqual({
      type: "inReserve",
    });
  });

  it("handles passTurn", () => {
    const game = buildTestGame();
    const queue = new MutatorQueue();
    queue.passTurn({ from: "alice", to: "bob" });
    queue.apply(new Mutator(game));
    expect(game.playerTakingTurnId).toBe("bob");
  });

  it("handles setActivity", () => {
    const game = buildTestGame();
    const queue = new MutatorQueue();
    queue.setActivity({
      activity: {
        type: "drawingCards",
        currentChoice: {
          name: "deck",
          type: "arbitrary",
          values: [""],
          min: 1,
          max: 1,
          choosingPlayerId: "alice",
          instructions: "Draw.",
        },
        nextChoices: [],
        previousDecisions: [],
      },
    });
    queue.apply(new Mutator(game));
    expect(game.activity.type).toBe("drawingCards");
  });
});
