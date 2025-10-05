/**
 * An incredibly clumsy first test, where players automatically choose the first
 * values in the list for each choice.
 */
import { GameData } from "@common/types";
import { makeDecision } from "@server/game/stateMachine";
import { createMockGameData } from "@server/mock";

function shuffle(array: any[]) {
	const copy = [...array];
	let currentIndex = array.length;
	while (currentIndex != 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[copy[currentIndex], copy[randomIndex]] = [
			copy[randomIndex],
			copy[currentIndex],
		];
	}
	return copy;
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
		const decision = {
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
				`Final game state ---------------------------------------------`,
			);
			console.log(JSON.stringify(gameData, null, 2));
			throw error;
		}
	}
	console.log(`Final game state ---------------------------------------------`);
	console.log(JSON.stringify(gameData, null, 2));
};

mockGame(createMockGameData(), 100);
