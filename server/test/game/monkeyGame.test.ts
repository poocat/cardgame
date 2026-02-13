/**
 * A stress-test of the game and the cards intended for production.
 *
 * Sets up a game, and randomly selects values for each choice, until the given
 * number of choices is met, or an error occurs.
 */

import { CONSTANTS } from "@common/game/constants";
import { initGameData } from "@server/game/initGameData";
import { makeDecision } from "@server/game/stateMachine";
import type { Decision, GameData } from "@server/types";
import { describe, expect, it } from "vitest";

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Produces deterministic sequences for reproducible tests.
 */
function createRng(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(array: T[], rng: () => number): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/******************************************************************************
 * ### assertInvariants
 *
 * Check invariant aspects of a game, such as the total number of chips per
 * player, the locations of cards and chips, the feasibility of the choice.
 ******************************************************************************/
function assertInvariants(gameData: GameData, label: string) {
  // 1. Total chip count is conserved
  const expectedChipCount =
    gameData.players.length * CONSTANTS.numChipsPerPlayer;
  expect(
    gameData.chips.length,
    `[${label}] chip count should be ${expectedChipCount}`,
  ).toBe(expectedChipCount);

  // 2. Every card has a valid location type
  for (const card of gameData.cards) {
    expect(
      ["inDeck", "inHand", "inPlay", "inDiscard"],
      `[${label}] card ${card.id} has invalid location: ${card.location.type}`,
    ).toContain(card.location.type);
  }

  // 3. Every chip is either in reserve or on a card that exists
  for (const chip of gameData.chips) {
    if (chip.location.type === "onCard") {
      const cardId = chip.location.cardId;
      const cardExists = gameData.cards.some((c) => c.id === cardId);
      expect(
        cardExists,
        `[${label}] chip ${chip.id} is on card ${cardId} which doesn't exist`,
      ).toBe(true);
    } else {
      expect(chip.location.type).toBe("inReserve");
    }
  }

  // 4. Current choice has valid structure
  const choice = gameData.activity.currentChoice;
  if (choice.max !== 0) {
    // Non-null choice
    expect(
      choice.values.length,
      `[${label}] choice "${choice.name}" has fewer values (${choice.values.length}) than min (${choice.min})`,
    ).toBeGreaterThanOrEqual(choice.min);
  }

  // 5. No player has too many producers in play
  for (const player of gameData.players) {
    const producersInPlay = gameData.cards.filter(
      (c) =>
        c.ownerId === player.id &&
        c.type === "producer" &&
        c.location.type === "inPlay",
    );
    expect(
      producersInPlay.length,
      `[${label}] player ${player.id} has ${producersInPlay.length} producers in play (max ${CONSTANTS.maxNumProducersInPlay})`,
    ).toBeLessThanOrEqual(CONSTANTS.maxNumProducersInPlay);
  }

  // 6. Exactly one playerTakingTurnId matches a player
  const turnPlayer = gameData.players.filter(
    (p) => p.id === gameData.playerTakingTurnId,
  );
  expect(
    turnPlayer.length,
    `[${label}] expected exactly 1 player taking turn, found ${turnPlayer.length}`,
  ).toBe(1);
}

/******************************************************************************
 * ### runMonkeyGame
 *
 * Creates a test game based on the given parameters, and runs through a given
 * number of randomized decisions.
 ******************************************************************************/
function runMonkeyGame(args: {
  seed: number;
  numPlayers: number;
  maxDecisions: number;
}) {
  const rng = createRng(args.seed);

  const players = Array.from({ length: args.numPlayers }, (_, i) => ({
    id: `player-${i}`,
    name: `Player ${i}`,
  }));

  let gameData = initGameData(players);
  assertInvariants(gameData, "init");

  for (let i = 0; i < args.maxDecisions; i++) {
    const currentChoice = gameData.activity.currentChoice;
    const shuffledValues = seededShuffle(currentChoice.values, rng);
    const numValues = Math.min(
      shuffledValues.length,
      currentChoice.max ?? shuffledValues.length,
    );

    const decision: Decision = {
      name: currentChoice.name,
      playerId: currentChoice.choosingPlayerId,
      values: shuffledValues.slice(0, numValues),
    };

    gameData = makeDecision({ gameData, decision });
    assertInvariants(gameData, `decision-${i}`);
  }

  return gameData;
}

describe("monkey game (randomized invariant testing)", () => {
  it("completes 200 decisions with 2 players without errors (seed 1)", () => {
    expect(() =>
      runMonkeyGame({ seed: 1, numPlayers: 2, maxDecisions: 200 }),
    ).not.toThrow();
  });

  it("completes 200 decisions with 2 players without errors (seed 42)", () => {
    expect(() =>
      runMonkeyGame({ seed: 42, numPlayers: 2, maxDecisions: 200 }),
    ).not.toThrow();
  });

  it("completes 200 decisions with 2 players without errors (seed 999)", () => {
    expect(() =>
      runMonkeyGame({ seed: 999, numPlayers: 2, maxDecisions: 200 }),
    ).not.toThrow();
  });

  it("completes 100 decisions with 3 players without errors", () => {
    expect(() =>
      runMonkeyGame({ seed: 7, numPlayers: 3, maxDecisions: 100 }),
    ).not.toThrow();
  });

  it("completes 100 decisions with 4 players without errors", () => {
    expect(() =>
      runMonkeyGame({ seed: 13, numPlayers: 4, maxDecisions: 100 }),
    ).not.toThrow();
  });
});
