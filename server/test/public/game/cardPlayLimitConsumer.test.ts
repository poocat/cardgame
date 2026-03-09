import { CONSTANTS } from "@common/game/constants";
import {
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { createChoosingActionChoice } from "@server/game/rules/transitions/choices";
import { Accessor } from "@server/game/runtime";
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

describe("consumer limit", () => {
  it("excludes consumer play action when at the consumer limit", () => {
    const builder = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .setPlayerTakingTurn("alice");

    // Fill alice's in-play area with the maximum number of consumers.
    for (let i = 0; i < CONSTANTS.maxNumConsumersInPlay; i++) {
      builder.addCard({
        owner: "alice",
        name: testCards.dummyConsumer.name,
        location: { type: "inPlay", exhausted: false },
      });
    }

    // Give alice a consumer in hand with a play action.
    builder.addCard({
      id: "c-extra",
      owner: "alice",
      name: testCards.consumerWithTwoStepAbility.name,
      location: { type: "inHand" },
      actionIdMap: { play: "c-extra-play" },
    });

    const game = builder.build();
    const accessor = new Accessor(game);
    const choice = createChoosingActionChoice({
      playerId: "alice",
      accessor,
    });

    // The play action for the extra consumer should not be in the available
    // choices, because alice is already at the consumer limit.
    expect(choice.values).not.toContain("c-extra-play");
  });

  it("includes consumer play action when below the consumer limit", () => {
    const builder = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .setPlayerTakingTurn("alice");

    // One fewer than the limit.
    for (let i = 0; i < CONSTANTS.maxNumConsumersInPlay - 1; i++) {
      builder.addCard({
        owner: "alice",
        name: testCards.dummyConsumer.name,
        location: { type: "inPlay", exhausted: false },
      });
    }

    // Give alice a consumer in hand with a play action.
    builder.addCard({
      id: "c-extra",
      owner: "alice",
      name: testCards.consumerWithTwoStepAbility.name,
      location: { type: "inHand" },
      actionIdMap: { play: "c-extra-play" },
    });

    const game = builder.build();
    const accessor = new Accessor(game);
    const choice = createChoosingActionChoice({
      playerId: "alice",
      accessor,
    });

    expect(choice.values).toContain("c-extra-play");
  });

  it("still allows other actions when consumer play is blocked", () => {
    const builder = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .setPlayerTakingTurn("alice");

    // Fill consumers to the limit.
    for (let i = 0; i < CONSTANTS.maxNumConsumersInPlay; i++) {
      builder.addCard({
        owner: "alice",
        name: testCards.dummyConsumer.name,
        location: { type: "inPlay", exhausted: false },
      });
    }

    // A producer in hand should be playable.
    builder.addCard({
      id: "c-prod",
      owner: "alice",
      name: testCards.basicProducer.name,
      location: { type: "inHand" },
      actionIdMap: { play: "c-prod-play" },
    });

    // A consumer in hand should not.
    builder.addCard({
      id: "c-cons",
      owner: "alice",
      name: testCards.consumerWithTwoStepAbility.name,
      location: { type: "inHand" },
      actionIdMap: { play: "c-cons-play" },
    });

    const game = builder.build();
    const accessor = new Accessor(game);
    const choice = createChoosingActionChoice({
      playerId: "alice",
      accessor,
    });

    expect(choice.values).toContain("c-prod-play");
    expect(choice.values).not.toContain("c-cons-play");
  });

  it("allows passing turn when at the consumer limit with no other actions", () => {
    const builder = new GameBuilder()
      .addPlayer("alice")
      .addPlayer("bob")
      .setPlayerTakingTurn("alice");

    for (let i = 0; i < CONSTANTS.maxNumConsumersInPlay; i++) {
      builder.addCard({
        owner: "alice",
        name: testCards.dummyConsumer.name,
        location: { type: "inPlay", exhausted: false },
      });
    }

    builder.addCard({
      id: "c-cons",
      owner: "alice",
      name: testCards.consumerWithTwoStepAbility.name,
      location: { type: "inHand" },
      actionIdMap: { play: "c-cons-play" },
    });

    const game = builder.build();

    // Player can pass (min is 0).
    expect(game.activity.currentChoice.min).toBe(0);

    const result = makeDecision({
      gameData: game,
      decision: {
        name: "actionToTake",
        playerId: "alice",
        values: [],
      },
    });

    expect(result.playerTakingTurnId).toBe("bob");
  });
});
