import { CONSTANTS } from "@common/game/constants";
import {
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { Accessor } from "@server/game/runtime";
import { getWinners } from "@server/game/winConditions";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testCards } from "../../fixtures/cards";
import { GameBuilder } from "../../helpers/GameBuilder";

beforeAll(() => {
  extendCardRegistry({ cards: Object.values(testCards) });
});

afterAll(() => {
  resetCardRegistry();
});

describe("getWinners", () => {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Win condition A: a player has N or more chips on a single consumer card.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("consumer chip threshold", () => {
    it("returns the player when a consumer has exactly the required chips", () => {
      const builder = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .setPlayerTakingTurn("alice")
        .addChipsInReserve("bob", 1)
        .addChipsInReserve("alice", 1)
        .addCard({
          id: "c-cons",
          owner: "alice",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        });

      for (let i = 0; i < CONSTANTS.numChipsOnConsumersToWin; i++) {
        builder.addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons" },
        });
      }

      const game = builder.build();
      const winners = getWinners(new Accessor(game));

      expect(winners).toHaveLength(1);
      expect(winners[0].id).toBe("alice");
    });

    it("does not return a player with fewer than the required chips on a consumer", () => {
      const builder = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .setPlayerTakingTurn("alice")
        .addChipsInReserve("alice", 1)
        .addChipsInReserve("bob", 1)
        .addCard({
          id: "c-cons",
          owner: "alice",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        });

      // Fall short of the win condition.
      for (let i = 0; i < CONSTANTS.numChipsOnConsumersToWin - 1; i++) {
        builder.addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons" },
        });
      }

      const game = builder.build();
      const winners = getWinners(new Accessor(game));

      expect(winners).toHaveLength(0);
    });

    it("does not count chips on a producer card", () => {
      const builder = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .setPlayerTakingTurn("alice")
        .addChipsInReserve("alice", 1)
        .addChipsInReserve("bob", 1)
        .addCard({
          id: "c-prod",
          owner: "alice",
          name: testCards.dummyProducer.name,
          location: { type: "inPlay", exhausted: false },
        });

      for (let i = 0; i < CONSTANTS.numChipsOnConsumersToWin; i++) {
        builder.addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-prod" },
        });
      }

      const game = builder.build();
      const winners = getWinners(new Accessor(game));

      expect(winners).toHaveLength(0);
    });
  });

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Win condition B: a player has all of their chips on consumer cards.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("all chips on consumers", () => {
    it("returns the player when all chips are distributed across consumers", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c-cons-1",
          owner: "alice",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        })
        .addCard({
          id: "c-cons-2",
          owner: "alice",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons-1" },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons-2" },
        })
        .addChipsInReserve("bob", 1)
        .setPlayerTakingTurn("alice")
        .build();

      const winners = getWinners(new Accessor(game));

      expect(winners).toHaveLength(1);
      expect(winners[0].id).toBe("alice");
    });

    it("does not return a player with chips in reserve", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c-cons",
          owner: "alice",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons" },
        })
        .addChipsInReserve("alice", 1)
        .addChipsInReserve("bob", 1)
        .setPlayerTakingTurn("alice")
        .build();

      const winners = getWinners(new Accessor(game));

      expect(winners).toHaveLength(0);
    });

    it("does not return a player with chips on a producer", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c-cons",
          owner: "alice",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        })
        .addCard({
          id: "c-prod",
          owner: "alice",
          name: testCards.dummyProducer.name,
          location: { type: "inPlay", exhausted: false },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons" },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-prod" },
        })
        .addChipsInReserve("bob", 1)
        .setPlayerTakingTurn("alice")
        .build();

      const winners = getWinners(new Accessor(game));

      expect(winners).toHaveLength(0);
    });

    it("does not return a player with chips in channel", () => {
      const game = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c-cons",
          owner: "alice",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        })
        .addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons" },
        })
        .addChip({
          owner: "alice",
          location: { type: "inChannel" },
        })
        .addChipsInReserve("bob", 1)
        .setPlayerTakingTurn("alice")
        .build();

      const winners = getWinners(new Accessor(game));

      expect(winners).toHaveLength(0);
    });
  });

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Multiple players
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  describe("multiple players", () => {
    it("can return multiple winners simultaneously", () => {
      const builder = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .setPlayerTakingTurn("alice")
        .addChipsInReserve("alice", 1)
        .addChipsInReserve("bob", 1)
        .addCard({
          id: "c-cons-a",
          owner: "alice",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        })
        .addCard({
          id: "c-cons-b",
          owner: "bob",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        });

      for (let i = 0; i < CONSTANTS.numChipsOnConsumersToWin; i++) {
        builder.addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons-a" },
        });
        builder.addChip({
          owner: "bob",
          location: { type: "onCard", cardId: "c-cons-b" },
        });
      }

      const game = builder.build();
      const winners = getWinners(new Accessor(game));

      expect(winners).toHaveLength(2);
    });

    it("only returns the player who meets a win condition", () => {
      const builder = new GameBuilder()
        .addPlayer("alice")
        .addPlayer("bob")
        .addCard({
          id: "c-cons-a",
          owner: "alice",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        })
        .addCard({
          id: "c-cons-b",
          owner: "bob",
          name: testCards.dummyConsumer.name,
          location: { type: "inPlay", exhausted: false },
        });

      for (let i = 0; i < CONSTANTS.numChipsOnConsumersToWin; i++) {
        builder.addChip({
          owner: "alice",
          location: { type: "onCard", cardId: "c-cons-a" },
        });
      }
      builder.addChipsInReserve("bob", 5);

      const game = builder.setPlayerTakingTurn("alice").build();
      const winners = getWinners(new Accessor(game));

      expect(winners).toHaveLength(1);
      expect(winners[0].id).toBe("alice");
    });
  });
});
