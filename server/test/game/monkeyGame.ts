/**
 * An incredibly clumsy first test, where players choose values randomly for
 * each choice.
 */

import { initGameData } from "@server/game/initGameData";
import { makeDecision } from "@server/game/stateMachine";
import type { Decision, GameData } from "@server/types";

function shuffle<T>(array: T[]) {
  const copy = [...array];
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [copy[currentIndex], copy[randomIndex]] = [
      copy[randomIndex],
      copy[currentIndex],
    ];
  }
  return copy;
}

function logGameData(gameData: GameData) {
  // Extract states that are not interesting.
  const { actions: _, ...rest } = gameData;
  console.log(JSON.stringify(rest, null, 2));
}

const mockGame = (initialGameData: GameData, numChoices: number) => {
  let gameData = initialGameData;
  for (let i = 0; i < numChoices; i++) {
    console.log(`${i} --------------------------------------------------`);
    console.log(`activity:`, JSON.stringify(gameData.activity, null, 2));
    const currentChoice = gameData.activity.currentChoice;
    const randomizedValues = shuffle(currentChoice.values);
    // Always choose the maximum number of choices allowed from the beginning of
    // the list.
    const decision: Decision = {
      name: currentChoice.name,
      playerId: gameData.activity.currentChoice.choosingPlayerId,
      values: randomizedValues.slice(
        0,
        currentChoice.max ?? randomizedValues.length,
      ),
    };
    console.log(`decision:`, JSON.stringify(decision, null, 2));
    try {
      gameData = makeDecision({
        gameData: gameData,
        decision: decision,
      });
    } catch (error) {
      console.log(
        `Final game data ---------------------------------------------`,
      );
      logGameData(gameData);
      throw error;
    }
  }
  console.log(`Final game data ---------------------------------------------`);
  logGameData(gameData);
};

mockGame(
  initGameData([
    { id: "dick", name: "Dick" },
    { id: "jane", name: "Jane" },
  ]),
  1000,
);
