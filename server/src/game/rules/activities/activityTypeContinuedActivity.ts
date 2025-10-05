import {
	ActivityData,
	ActivityTypeMap,
	Decision,
	NextChoiceData,
} from "@common/types";
import { getActionDefinition } from "@server/game/cards/utils";
import { Decisions } from "@server/game/utils/Decisions";
import { GameState } from "@server/game/utils/GameState";
import {
	createActionChoices,
	nullChoice,
} from "@server/game/rules/activities/choices";

/******************************************************************************
 * ### Activity Generators by Continued Activity
 *
 * If an activity requires more than one choice, it will need to be
 * "continued".
 ******************************************************************************/
export const activityTypeContinuedActivity: ActivityTypeMap<
	(args: {
		gameState: GameState;
		currentActivity: ActivityData;
		currentDecisions: Decision[];
	}) => ActivityData
> = {
	drawingCards: ({ currentActivity }) => {
		throw new Error(
			`'${currentActivity.type}' activities must only have one choice`,
		);
	},
	choosingAction: ({ currentActivity }) => {
		throw new Error(
			`'${currentActivity.type}' activities must only have one choice`,
		);
	},
	takingAction: ({ gameState, currentActivity, currentDecisions }) => {
		if (currentActivity.type !== "takingAction") {
			throw new Error(
				`Expected a 'takingAction' activity type, found '${currentActivity.type}.'`,
			);
		}
		if (currentActivity.nextChoices.length < 1) {
			throw new Error(`Cannot continue an activity with no remaining choices.`);
		}
		const next: ActivityData = {
			...currentActivity,
			nextChoices: currentActivity.nextChoices.slice(1),
			previousDecisions: currentDecisions,
		};
		const nextChoice = currentActivity.nextChoices[0];
		if (nextChoice.type === "dependent") {
			const action = gameState.getActionById({
				actionId: currentActivity.actionId,
			});
			const actionDef = getActionDefinition({
				cardName: action.card.name,
				actionType: action.type,
			});
			const choiceDef = actionDef.sequence?.choices[nextChoice.index];
			if (!choiceDef) {
				throw new Error(
					`No choice for action '${action.id}' at index ${nextChoice.index}`,
				);
			}
			const nextActionChoices = createActionChoices({
				choiceDef,
				gameState: gameState,
				currentDecisions: new Decisions(currentDecisions),
				actionContext: {
					cardId: action.card.id,
					playerTakingActionId: currentActivity.playerTakingActionId,
				},
			});
			next.currentChoice = nextActionChoices[0] ?? nullChoice();
			const remaining: NextChoiceData[] = nextActionChoices.map((choice) => ({
				type: "independent",
				choice,
			}));
			next.nextChoices = [...remaining, ...next.nextChoices];
		} else {
			next.currentChoice = nextChoice.choice;
		}
		return next;
	},
};
