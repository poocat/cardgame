/**
 * An incredibly clumsy first test, where players automatically choose the first
 * values in the list for each choice.
 */
import { GameData } from "@common/types";
import { makeDecision } from "@server/game/stateMachine";
import { createMockGameData } from "@server/mock";

const mockGame = (initialGameData: GameData, numChoices: number) => {
  let gameData = initialGameData;
  for (let i = 0; i < numChoices; i++) {
    console.log(`${i} --------------------------------------------------`);
    const currentChoice = gameData.activity.currentChoice;
    console.log(`choice:`, currentChoice);
    // Always choose the maximum number of choices allowed from the beginning of
    // the list.
    const decision = {
      name: currentChoice.name,
      playerId: gameData.activity.currentChoice.choosingPlayerId,
      values: currentChoice.values.slice(
        0,
        currentChoice.max ?? currentChoice.values.length,
      ),
    };
    console.log(`decision:`, decision);
    gameData = makeDecision({
      gameData: gameData,
      decision: decision,
    });
  }
  console.log(`Final game state ---------------------------------------------`);
  console.log(JSON.stringify(gameData, null, 2));
};

mockGame(createMockGameData(), 20);
