import {
  ActionData,
  ActionTypeMap,
  ActivityData,
  CardData,
  CardLocationData,
  CardLocationType,
  CardType,
  ChipData,
  ChipLocationData,
  ChoiceType,
  ChoiceValue,
  Decision,
  Id,
  PlayerData,
} from "@server/types";
import { Decisions } from "@server/game/runtime";

////////////////////////////////////////////////////////////////////////////////
// Utility types
////////////////////////////////////////////////////////////////////////////////

interface _DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}
type _DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
export type DeepReadonly<T> = T extends (infer R)[]
  ? _DeepReadonlyArray<R>
  : T extends Function
    ? T
    : T extends object
      ? _DeepReadonlyObject<T>
      : T;

////////////////////////////////////////////////////////////////////////////////
// Accessors
////////////////////////////////////////////////////////////////////////////////
const accessorTypes = [
  "getActionById",
  "getCardById",
  "getCards",
  "getChipsOnCard",
  "getPlayerChipsInReserve",
  "getPlayerTakingTurn",
] as const;
type AccessorType = (typeof accessorTypes)[number];
type _AccessorArgs = {
  getActionById: { actionId: Id };
  getCardById: { cardId: Id };
  getCards: {
    playerIds?: Id[];
    types?: CardType[];
    locationTypes?: CardLocationType[];
    exhausted?: boolean;
    minChips?: number;
    maxChips?: number;
    excludeIds?: Id[];
  };
  getChipsOnCard: { cardId: Id };
  getPlayerChipsInReserve: { playerId: Id };
  getPlayerTakingTurn: undefined;
};
export type AccessorArgs = {
  [K in AccessorType]: _AccessorArgs[K];
};
type AccessorMethods<TReturn> = {
  [key in keyof AccessorArgs]: (args: AccessorArgs[key]) => TReturn;
};
export interface IAccessor extends AccessorMethods<unknown> {
  cards: DeepReadonly<CardData[]>;
  players: DeepReadonly<PlayerData[]>;
  chips: DeepReadonly<ChipData[]>;
  actions: DeepReadonly<ActionData[]>;

  getActionById(args: { actionId: Id }): DeepReadonly<ActionData>;
  getCardById(args: { cardId: Id }): DeepReadonly<CardData>;
  getCards(args: {
    playerIds?: Id[];
    types?: CardType[];
    locationTypes?: CardLocationType[];
    exhausted?: boolean;
    minChips?: number;
    maxChips?: number;
    excludeIds?: Id[];
  }): DeepReadonly<CardData>[];
  getChipsOnCard(args: { cardId: Id }): DeepReadonly<ChipData>[];
  getPlayerChipsInReserve(args: { playerId: Id }): DeepReadonly<ChipData>[];
  getPlayerTakingTurn(): DeepReadonly<PlayerData>;
}

////////////////////////////////////////////////////////////////////////////////
// Mutators
////////////////////////////////////////////////////////////////////////////////
const mutationTypes = [
  "moveChips",
  "moveCard",
  "exhaustCard",
  "passTurn",
  "setActivity",
] as const;
type MutatorType = (typeof mutationTypes)[number];
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
type MutatorMethods<TReturn> = {
  [key in keyof MutatorArgs]: (args: MutatorArgs[key]) => TReturn;
};
export interface IMutator extends MutatorMethods<void> {}

export type ActionContext = {
  /** The id of the card the action is printed on. */
  cardId: Id;
  playerTakingActionId: Id;
};

////////////////////////////////////////////////////////////////////////////////
// Decisions
////////////////////////////////////////////////////////////////////////////////
export interface IDecisions {
  decisions: DeepReadonly<Decision[]>;
  getValues(args: { name: string; playerId: Id }): ChoiceValue[];
  getPlayerIds(args: { name: string }): Id[];
}

////////////////////////////////////////////////////////////////////////////////
// Filtering/messaging
////////////////////////////////////////////////////////////////////////////////
export type CheckResult =
  | { ok: true; reasons?: never }
  | { ok: false; reasons: string[] };

////////////////////////////////////////////////////////////////////////////////
// Card definitions
////////////////////////////////////////////////////////////////////////////////
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
    accessor: IAccessor;
    currentDecisions: Decisions;
    context: ActionContext;
  }) => Id[];
  /** Use to retrieve the values to choose between from the game data. */
  getValues: (args: {
    accessor: IAccessor;
    currentDecisions: Decisions;
    context: ActionContext & { choosingPlayerId: Id };
  }) => string[];
};

export type SequenceDef = {
  /** Use to check the game data for the conditions necessary to complete the sequence. */
  check?: (args: {
    accessor: IAccessor;
    context: ActionContext;
  }) => CheckResult;
  /** Use to define the choices that need to be made in order to affect the game data. */
  choices: ChoiceDef[];
  /** Use to define the effect the decisions should have on the game data at the conclusion of the activity. */
  affect: (args: {
    accessor: IAccessor;
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
    current: IAccessor;
    next: IAccessor;
    context: {
      /** The card with the trigger. */
      cardId: Id;
    };
    mutator: IMutator;
  }) => void;
};

export type CardDef = {
  /** The unique name of the card. Will be copied into the game data, and used to correlate cards in the game with their definitions. */
  name: string;
  type: CardType;
  actions: Partial<ActionTypeMap<ActionDef>>;
  /** Each card can have a single, custom triggered effect. The trigger is only active while the card is in play. */
  trigger?: TriggerDef;
};
