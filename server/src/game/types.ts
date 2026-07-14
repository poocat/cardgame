import type { Decisions } from "@server/game/runtime";
import type {
  ActionData,
  ActionTypeMap,
  ActivityData,
  CardData,
  CardLocationData,
  CardLocationType,
  CardType,
  ChipData,
  ChipLocationData,
  ChipLocationType,
  ChoiceType,
  ChoiceValue,
  Decision,
  Id,
  Message,
  PlayerData,
} from "@server/types";

////////////////////////////////////////////////////////////////////////////////
// Utility types
////////////////////////////////////////////////////////////////////////////////

interface _DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}
type _DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
type _Function = (...args: never) => unknown;

export type DeepReadonly<T> = T extends (infer R)[]
  ? _DeepReadonlyArray<R>
  : T extends _Function
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
  "getChips",
  "getPlayerTakingTurn",
  "getTurnTransition",
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
  getChips: {
    playerIds?: Id[];
    locationTypes?: ChipLocationType[];
    cardIds?: Id[];
    excludeIds?: Id[];
  };
  getPlayerTakingTurn: undefined;
  getTurnTransition: { from?: Id };
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
  getVisibleActions(args: { playerId: Id }): DeepReadonly<ActionData[]>;
  getCardById(args: { cardId: Id }): DeepReadonly<CardData>;
  /** Parameterized "query" for cards. */
  getCards(args: {
    playerIds?: Id[];
    types?: CardType[];
    locationTypes?: CardLocationType[];
    exhausted?: boolean;
    minChips?: number;
    maxChips?: number;
    excludeIds?: Id[];
  }): DeepReadonly<CardData>[];
  /** Parameterized "query" for chips. */
  getChips(args: {
    playerIds?: Id[];
    locationTypes?: ChipLocationType[];
    cardIds?: Id[];
    excludeIds?: Id[];
  }): DeepReadonly<ChipData>[];
  /** Returns the player data for the player currently taking their turn. */
  getPlayerTakingTurn(): DeepReadonly<PlayerData>;
  /** Returns the player data for the given player––or the player currently taking their turn, if omitted––and the player that comes after them. */
  getTurnTransition(args: { from?: Id }): {
    from: DeepReadonly<PlayerData>;
    to: DeepReadonly<PlayerData>;
  };
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
  "addWin",
] as const;
type MutatorType = (typeof mutationTypes)[number];
type _MutatorArgs = {
  moveChips: { ids: Id[]; location: ChipLocationData };
  moveCard: { id: Id; location: CardLocationData };
  exhaustCard: { id: Id; value: boolean };
  passTurn: { from: Id; to: Id };
  setActivity: { activity: ActivityData };
  addWin: { playerId: Id };
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
  getDecisions(): Decision[];
  getValues(args: { name: string; playerId: Id }): ChoiceValue[];
  getPlayerIds(args: { name: string }): Id[];
}

////////////////////////////////////////////////////////////////////////////////
// Filtering/annotating
////////////////////////////////////////////////////////////////////////////////
export type CheckResult =
  | { ok: true; reasons?: never }
  | { ok: false; reasons: Message[] };

export interface IAnnotator {
  add(args: { id: Id; messages: Message[] }): void;
  clear(): void;
}

////////////////////////////////////////////////////////////////////////////////
// Card definitions
////////////////////////////////////////////////////////////////////////////////
export type ChoiceDef = {
  /** The "name" of the choice. */
  name: string;
  type: ChoiceType;
  instructions: Message;
  /** Use to provide labels for any of the values returned by `getValues` */
  labels?: Record<string, Message>;
  /** Use to indicate the minimum number of options the player must select from the given options. */
  min?: number;
  /** Use to indicate the maximum number of options the player may select from the given options. */
  max?: number;
  /** To to generate a value for `min` if undefined. */
  getMin?: (args: {
    accessor: IAccessor;
    currentDecisions: Decisions;
    context: ActionContext & { choosingPlayerId: Id };
    values: ChoiceValue[];
  }) => number;
  /** To to generate a value for `max` if undefined. */
  getMax?: (args: {
    accessor: IAccessor;
    currentDecisions: Decisions;
    context: ActionContext & { choosingPlayerId: Id };
    values: ChoiceValue[];
  }) => number;
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
  /** Use to determine which players will go through the sequence. */
  getPlayers?: (args: {
    accessor: IAccessor;
    context: ActionContext;
  }) => PlayerData[];
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
  instructions?: Message;
  /** The sequence for the action's activity. If undefined, only the default effects (for the given action type) will be used. */
  sequence?: SequenceDef;
  /** Use to skip default effects, since default effects can potentially "overwrite" custom effects. */
  skipDefaultEffects?: boolean;
};

export type TriggerDef = {
  instructions: Message;
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

type LinkDef = {
  type: "imgsrc";
  label?: string;
  description?: string;
  url: string;
};

export type CardDef = {
  /** The unique name of the card. Will be copied into the game data, and used to correlate cards in the game with their definitions. */
  name: string;
  /** The name of the card as it is displayed to the player. Supports localization. Defaults to `name`. */
  display?: Message;
  type: CardType;
  /** The flavor subtype for the card. Supports localization and icon lookup. */
  subtype?: Message;
  actions: Partial<ActionTypeMap<ActionDef>>;
  /** Each card can have a single, custom triggered effect. The trigger is only active while the card is in play. */
  trigger?: TriggerDef;
  /** Any card */
  links?: LinkDef[];
};

export type CardMap = Record<string, CardDef>;
