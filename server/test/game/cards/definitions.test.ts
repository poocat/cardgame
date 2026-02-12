import {
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { makeDecision } from "@server/game/stateMachine";
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
 * Simple Play Action
 ******************************************************************************/
describe("simple play action", () => {
  it("moves card from hand to inPlay", () => {
    const game = new GameBuilder()
      .addPlayer("alice")
      .addCard({
        id: "prod-1",
        owner: "alice",
        location: { type: "inHand" },
        name: testCards.basicProducer.name,
        actionIdMap: { play: "prod-1-play" },
      })
      .setUpActionActivity("prod-1-play")
      .build();

    const result = makeDecision({
      gameData: game,
      decision: {
        name: "actionToTake",
        playerId: "alice",
        values: ["prod-1-play"],
      },
    });

    const card = result.cards.find((c) => c.id === "prod-1");
    expect(card?.location.type).toBe("inPlay");
    expect(result.activity.type).toBe("choosingAction");
  });
});

/******************************************************************************
 * Ability with Chip Transfer (reserve to card)
 ******************************************************************************/
describe("ability with chip transfer", () => {
  it("moves chip from reserve onto the card", () => {
    const game = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .addCard({
        id: "prod-1",
        owner: "alice",
        name: testCards.producerWithChipAbility.name,
        location: { type: "inPlay", exhausted: false },
        actionIdMap: { ability: "prod-1-ability" },
      })
      .addChip({
        id: "ch-a1",
        owner: "alice",
        location: { type: "inReserve" },
      })
      .addChipsInReserve("alice", 2)
      .addChipsInReserve("bob", 5)
      .setPlayerTakingTurn("alice")
      .setUpActionActivity("prod-1-ability")
      .build();

    game.activity = {
      type: "takingAction",
      actionId: "prod-1-ability",
      playerTakingActionId: "alice",
      currentChoice: {
        name: "targetChips",
        type: "chipId",
        choosingPlayerId: "alice",
        instructions: "Move up to one chip from your reserve to this card.",
        values: ["ch-a1"],
        min: 0,
        max: 1,
      },
      nextChoices: [],
      previousDecisions: [],
    };

    const result = makeDecision({
      gameData: game,
      decision: {
        name: "targetChips",
        playerId: "alice",
        values: ["ch-a1"],
      },
    });

    const chip = result.chips.find((c) => c.id === "ch-a1");
    expect(chip?.location).toEqual({ type: "onCard", cardId: "prod-1" });

    // Card should be exhausted after ability
    const card = result.cards.find((c) => c.id === "prod-1");
    expect(card?.location).toEqual({ type: "inPlay", exhausted: true });
  });

  it("allows choosing 0 chips (optional)", () => {
    const game = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .addCard({
        id: "prod-1",
        owner: "alice",
        name: testCards.producerWithChipAbility.name,
        location: { type: "inPlay", exhausted: false },
        actionIdMap: { ability: "prod-1-ability" },
      })
      .addChipsInReserve("alice", 3)
      .addChipsInReserve("bob", 3)
      .setPlayerTakingTurn("alice")
      .build();

    const reserveChips = game.chips
      .filter((c) => c.ownerId === "alice" && c.location.type === "inReserve")
      .map((c) => c.id);

    game.activity = {
      type: "takingAction",
      actionId: "prod-1-ability",
      playerTakingActionId: "alice",
      currentChoice: {
        name: "targetChips",
        type: "chipId",
        choosingPlayerId: "alice",
        instructions: "Move up to one chip from your reserve to this card.",
        values: reserveChips,
        min: 0,
        max: 1,
      },
      nextChoices: [],
      previousDecisions: [],
    };

    const result = makeDecision({
      gameData: game,
      decision: {
        name: "targetChips",
        playerId: "alice",
        values: [],
      },
    });

    // All chips should still be in reserve
    const aliceChips = result.chips.filter((c) => c.ownerId === "alice");
    expect(aliceChips.every((c) => c.location.type === "inReserve")).toBe(true);
  });
});

/******************************************************************************
 * Play Action with Check
 ******************************************************************************/
describe("play action with check", () => {
  it("moves chip from a producer onto the consumer when played", () => {
    const game = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .addCard({
        id: "cons-1",
        owner: "alice",
        name: testCards.consumerWithPlayCheck.name,
        location: { type: "inHand" },
        actionIdMap: { play: "cons-1-play" },
      })
      .addCard({
        id: "prod-1",
        owner: "alice",
        name: testCards.dummyProducer.name,
        location: { type: "inPlay", exhausted: false },
      })
      .addChip({
        id: "ch-on-prod",
        owner: "alice",
        location: { type: "onCard", cardId: "prod-1" },
      })
      .addChipsInReserve("alice", 3)
      .addChipsInReserve("bob", 3)
      .setPlayerTakingTurn("alice")
      .build();

    game.activity = {
      type: "takingAction",
      actionId: "cons-1-play",
      playerTakingActionId: "alice",
      currentChoice: {
        name: "targetChips",
        type: "chipId",
        choosingPlayerId: "alice",
        instructions:
          "Move one chip from one of your producers onto this card.",
        values: ["ch-on-prod"],
        min: 1,
        max: 1,
      },
      nextChoices: [],
      previousDecisions: [],
    };

    const result = makeDecision({
      gameData: game,
      decision: {
        name: "targetChips",
        playerId: "alice",
        values: ["ch-on-prod"],
      },
    });

    // Consumer should be in play
    const consumer = result.cards.find((c) => c.id === "cons-1");
    expect(consumer?.location.type).toBe("inPlay");

    // Chip should have moved to the consumer
    const chip = result.chips.find((c) => c.id === "ch-on-prod");
    expect(chip?.location).toEqual({ type: "onCard", cardId: "cons-1" });
  });
});

/******************************************************************************
 * Two-Step Ability (Dependent Choices)
 ******************************************************************************/
describe("two-step ability with dependent choices", () => {
  it("moves chip from consumer to chosen producer in two decisions", () => {
    const game = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .addCard({
        id: "cons-1",
        owner: "alice",
        name: testCards.consumerWithTwoStepAbility.name,
        location: { type: "inPlay", exhausted: false },
        actionIdMap: { ability: "cons-1-ability" },
      })
      .addCard({
        id: "prod-1",
        owner: "alice",
        name: testCards.dummyProducer.name,
        location: { type: "inPlay", exhausted: false },
      })
      .addChip({
        id: "ch-on-cons",
        owner: "alice",
        location: { type: "onCard", cardId: "cons-1" },
      })
      .addChip({
        id: "ch-on-cons-2",
        owner: "alice",
        location: { type: "onCard", cardId: "cons-1" },
      })
      .addChipsInReserve("alice", 3)
      .addChipsInReserve("bob", 3)
      .setPlayerTakingTurn("alice")
      .build();

    // Set up first choice: choose target producer card
    game.activity = {
      type: "takingAction",
      actionId: "cons-1-ability",
      playerTakingActionId: "alice",
      currentChoice: {
        name: "targetCard",
        type: "cardId",
        choosingPlayerId: "alice",
        instructions: "Choose one of your producer cards.",
        values: ["prod-1"],
        min: 1,
        max: 1,
      },
      nextChoices: [{ type: "dependent", index: 1 }],
      previousDecisions: [],
    };

    // Decision 1: choose the producer
    let result = makeDecision({
      gameData: game,
      decision: {
        name: "targetCard",
        playerId: "alice",
        values: ["prod-1"],
      },
    });

    // Should still be in takingAction, now asking for chip
    expect(result.activity.type).toBe("takingAction");

    // Decision 2: choose the chip
    result = makeDecision({
      gameData: result,
      decision: {
        name: "targetChips",
        playerId: "alice",
        values: ["ch-on-cons"],
      },
    });

    // Chip should now be on the producer
    const chip = result.chips.find((c) => c.id === "ch-on-cons");
    expect(chip?.location).toEqual({ type: "onCard", cardId: "prod-1" });

    // Consumer should still be alive (still has ch-on-cons-2)
    const consumer = result.cards.find((c) => c.id === "cons-1");
    expect(consumer?.location.type).toBe("inPlay");
  });
});

/******************************************************************************
 * Trigger on Chip Removal
 ******************************************************************************/
describe("trigger on chip removal", () => {
  it("discards producer when last chip is removed", () => {
    const game = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .addCard({
        id: "dying-1",
        owner: "alice",
        name: testCards.producerThatCanDie.name,
        location: { type: "inPlay", exhausted: false },
        actionIdMap: { ability: "dying-1-ability" },
      })
      .addCard({
        id: "cons-1",
        owner: "alice",
        name: testCards.dummyConsumer.name,
        location: { type: "inPlay", exhausted: false },
      })
      .addChip({
        id: "ch-on-dying",
        owner: "alice",
        location: { type: "onCard", cardId: "dying-1" },
      })
      .addChip({
        id: "ch-on-cons",
        owner: "alice",
        location: { type: "onCard", cardId: "cons-1" },
      })
      .addChipsInReserve("alice", 3)
      .addChipsInReserve("bob", 3)
      .setPlayerTakingTurn("alice")
      .build();

    // Set up the two-choice ability
    game.activity = {
      type: "takingAction",
      actionId: "dying-1-ability",
      playerTakingActionId: "alice",
      currentChoice: {
        name: "targetCard",
        type: "cardId",
        choosingPlayerId: "alice",
        instructions: "Choose one of your consumer cards.",
        values: ["cons-1"],
        min: 1,
        max: 1,
      },
      nextChoices: [{ type: "dependent", index: 1 }],
      previousDecisions: [],
    };

    // Decision 1: choose consumer target
    let result = makeDecision({
      gameData: game,
      decision: {
        name: "targetCard",
        playerId: "alice",
        values: ["cons-1"],
      },
    });

    // Decision 2: choose chip from dying producer
    result = makeDecision({
      gameData: result,
      decision: {
        name: "targetChips",
        playerId: "alice",
        values: ["ch-on-dying"],
      },
    });

    // Dying producer should be discarded (trigger fired)
    const dying = result.cards.find((c) => c.id === "dying-1");
    expect(dying?.location?.type).toBe("inDiscard");

    // Chip should be on consumer
    const chip = result.chips.find((c) => c.id === "ch-on-dying");
    expect(chip?.location).toEqual({ type: "onCard", cardId: "cons-1" });
  });

  it("does NOT discard when chips remain", () => {
    const game = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .addCard({
        id: "dying-1",
        owner: "alice",
        name: testCards.producerThatCanDie.name,
        location: { type: "inPlay", exhausted: false },
        actionIdMap: { ability: "dying-1-ability" },
      })
      .addCard({
        id: "cons-1",
        owner: "alice",
        name: testCards.dummyConsumer.name,
        location: { type: "inPlay", exhausted: false },
      })
      .addChip({
        id: "ch-on-dying-1",
        owner: "alice",
        location: { type: "onCard", cardId: "dying-1" },
      })
      .addChip({
        id: "ch-on-dying-2",
        owner: "alice",
        location: { type: "onCard", cardId: "dying-1" },
      })
      .addChip({
        id: "ch-on-cons",
        owner: "alice",
        location: { type: "onCard", cardId: "cons-1" },
      })
      .addChipsInReserve("alice", 3)
      .addChipsInReserve("bob", 3)
      .setPlayerTakingTurn("alice")
      .build();

    game.activity = {
      type: "takingAction",
      actionId: "dying-1-ability",
      playerTakingActionId: "alice",
      currentChoice: {
        name: "targetCard",
        type: "cardId",
        choosingPlayerId: "alice",
        instructions: "Choose one of your consumer cards.",
        values: ["cons-1"],
        min: 1,
        max: 1,
      },
      nextChoices: [{ type: "dependent", index: 1 }],
      previousDecisions: [],
    };

    let result = makeDecision({
      gameData: game,
      decision: {
        name: "targetCard",
        playerId: "alice",
        values: ["cons-1"],
      },
    });

    result = makeDecision({
      gameData: result,
      decision: {
        name: "targetChips",
        playerId: "alice",
        values: ["ch-on-dying-1"],
      },
    });

    // Dying producer should still be in play (one chip remains)
    const dying = result.cards.find((c) => c.id === "dying-1");
    expect(dying?.location.type).toBe("inPlay");
  });
});

/******************************************************************************
 * Multi-Player Ability
 ******************************************************************************/
describe("multi-player ability", () => {
  it("generates choices for all eligible players", () => {
    const game = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .addCard({
        id: "multi-1",
        owner: "alice",
        name: testCards.producerWithMultiPlayerAbility.name,
        location: { type: "inPlay", exhausted: false },
        actionIdMap: { ability: "multi-1-ability" },
      })
      .addCard({
        id: "cons-a",
        owner: "alice",
        name: testCards.dummyConsumer.name,
        location: { type: "inPlay", exhausted: false },
      })
      .addCard({
        id: "cons-b",
        owner: "bob",
        name: testCards.dummyConsumer.name,
        location: { type: "inPlay", exhausted: false },
      })
      .addChip({
        id: "ch-cons-a",
        owner: "alice",
        location: { type: "onCard", cardId: "cons-a" },
      })
      .addChip({
        id: "ch-cons-b",
        owner: "bob",
        location: { type: "onCard", cardId: "cons-b" },
      })
      .addChip({
        id: "ch-res-a",
        owner: "alice",
        location: { type: "inReserve" },
      })
      .addChip({
        id: "ch-res-b",
        owner: "bob",
        location: { type: "inReserve" },
      })
      .setPlayerTakingTurn("alice")
      .setUpActionActivity("multi-1-ability")
      .build();

    // Choose the multi-player ability
    const result = makeDecision({
      gameData: game,
      decision: {
        name: "actionToTake",
        playerId: "alice",
        values: ["multi-1-ability"],
      },
    });

    // Should be in takingAction with first player's chip choice
    expect(result.activity.type).toBe("takingAction");
    const firstChoice = result.activity.currentChoice;
    // The choosing player should be one of the eligible players
    expect(["alice", "bob"]).toContain(firstChoice.choosingPlayerId);
  });
});
