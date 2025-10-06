import {
	ActionTypeMap,
	ActivityData,
	CardLocationData,
	CardType,
	ChipLocationData,
	ChoiceType,
	GameData,
	Id,
} from "@common/types";
import { Decisions, GameState } from "@server/game/utils";

export const mutationTypes = [
	"moveChips",
	"moveCard",
	"exhaustCard",
	"passTurn",
	"setActivity",
] as const;
export type MutatorType = (typeof mutationTypes)[number];
export type MutatorMap<T> = { [K in MutatorType]: T };
// TODO!!! No actions should have access to `passTurn` and `setActivity`
// mutations.
type _MutatorArgs = {
	moveChips: { ids: Id[]; location: ChipLocationData };
	moveCard: { id: Id; location: CardLocationData };
	exhaustCard: { id: Id; value: boolean };
	passTurn: { from: Id; to: Id };
	setActivity: { activity: ActivityData };
};
export type MutatorArgs = {
	[K in MutatorType]: _MutatorArgs[K];
};
export type MutatorMethods<TReturn> = {
	[key in keyof MutatorArgs]: (args: MutatorArgs[key]) => TReturn;
};
export interface IMutator extends MutatorMethods<void> {}

export type ActionContext = {
	/** The id of the card the action is printed on. */
	cardId: Id;
	playerTakingActionId: Id;
};

export type CheckResult =
	| { ok: true; reasons?: never }
	| { ok: false; reasons: string[] };

// Cards
export type ChoiceDef = {
	/** The "name" of the choice. */
	name: string;
	type: ChoiceType;
	instructions: string;
	/** Use to indicate the minimum number of options the player must select from the given options. */
	min: number;
	/** Use to indicate the maximum number of options the player may select from the given options. */
	max: number;
	/** Use to determine which players must make the choice. If not included, will default to only the player taking the action. */
	getChoosingPlayers?: (args: {
		gameState: GameState;
		currentDecisions: Decisions;
		context: ActionContext;
	}) => Id[];
	/** Use to retrieve the values to choose between from the game state. */
	getValues: (args: {
		gameState: GameState;
		currentDecisions: Decisions;
		context: ActionContext & { choosingPlayerId: Id };
	}) => string[];
};

export type SequenceDef = {
	/** Use to check the game state for the conditions necessary to complete the sequence. */
	check?: (args: {
		gameState: GameState;
		context: ActionContext;
	}) => CheckResult;
	/** Use to define the choices that need to be made in order to affect the game state. */
	choices: ChoiceDef[];
	/** Use to define the effect the decisions should have on the game state at the conclusion of the activity. */
	affect: (args: {
		gameState: GameState;
		context: ActionContext;
		decisions: Decisions;
		mutator: IMutator;
	}) => void;
};

export type ActionDef = {
	/** Instructions to display on the card. */
	instructions?: string;
	/** The sequence for the action's activity. If undefined, only the default effects (for the given action type) will be used. */
	sequence?: SequenceDef;
};

export type TriggerDef = {
	instructions: string;
	affect: (args: {
		current: GameState;
		next: GameState;
		context: {
			/** The card with the trigger. */
			cardId: Id;
		};
		mutator: IMutator;
	}) => void;
};

export type CardDef = {
	/** The unique name of the card. Will be copied into the game state, and used to correlate cards in the game with their definitions. */
	name: string;
	type: CardType;
	actions: Partial<ActionTypeMap<ActionDef>>;
	/** Each card can have a single, custom triggered effect. The trigger is only active while the card is in play. */
	trigger?: TriggerDef;
};
