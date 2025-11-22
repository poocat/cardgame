import {
  actionTypes,
  activityTypes,
  cardLocationTypes,
  cardTypes,
  chipLocationTypes,
  choiceTypes,
} from "@common/game/enums";

////////////////////////////////////////////////////////////////////////////////
// Utility types
////////////////////////////////////////////////////////////////////////////////

/** Generic type for const arrays. Only used in other generic utility types. */
type _LiteralArray = readonly string[];

/** Use to type a constant array of strings into a literal union type. */
type _UnionFromArray<TArray extends _LiteralArray> = TArray[number];

/** Use to type a mapping from keys defined in a constant array of strings to a given type. */
type _MapFromArray<TArray extends _LiteralArray, TValue> = {
  [K in TArray[number]]: TValue;
};
/** Use to type a discriminated union of objects from constant array of strings, and a mapping of those strings to their data.  */
type _DiscriminatedUnionFromArray<
  TArray extends _LiteralArray,
  TDataMap extends _MapFromArray<TArray, unknown>,
  TCommon extends object = Record<string, unknown>,
> = {
  [K in _UnionFromArray<TArray>]: { type: K } & TCommon & TDataMap[K];
}[_UnionFromArray<TArray>];

////////////////////////////////////////////////////////////////////////////////
// Game data types
////////////////////////////////////////////////////////////////////////////////

export type Id = string;

export type ActionType = _UnionFromArray<typeof actionTypes>;
export type ActionTypeMap<T> = _MapFromArray<typeof actionTypes, T>;
export type ActionData = _DiscriminatedUnionFromArray<
  typeof actionTypes,
  {
    play: {};
    ability: {};
    discard: {};
  },
  {
    id: Id;
    // TODO!!! Name and owner are copies of card data. Should normalize.
    card: { id: Id; name: string; ownerId: Id };
    // TODO!!! The instructions should come directly from the card definition
    // at "digest" time.
    instructions: string;
  }
>;

export type ChipLocationType = _UnionFromArray<typeof chipLocationTypes>;
export type ChipLocationMap<T> = _MapFromArray<typeof chipLocationTypes, T>;
export type ChipLocationData = _DiscriminatedUnionFromArray<
  typeof chipLocationTypes,
  {
    inReserve: {};
    onCard: { cardId: Id };
  }
>;
export type ChipData = {
  id: Id;
  ownerId: Id;
  location: ChipLocationData;
};

export type CardLocationType = _UnionFromArray<typeof cardLocationTypes>;
export type CardLocationMap<T> = _MapFromArray<typeof cardLocationTypes, T>;
export type CardLocationData = _DiscriminatedUnionFromArray<
  typeof cardLocationTypes,
  {
    inHand: {};
    inPlay: { exhausted: boolean };
    inDiscard: {};
    inDeck: {};
  }
>;

export type CardType = _UnionFromArray<typeof cardTypes>;
export type CardTypeMap<T> = _MapFromArray<typeof cardTypes, T>;
export type CardData = _DiscriminatedUnionFromArray<
  typeof cardTypes,
  {
    producer: {};
    consumer: {};
  },
  {
    id: Id;
    name: string;
    ownerId: Id;
    location: CardLocationData;
  }
>;

export type PlayerData = {
  id: Id;
  name: string;
  turnCount: number;
};

export type ChoiceType = _UnionFromArray<typeof choiceTypes>;
export type ChoiceTypeMap<T> = _MapFromArray<typeof choiceTypes, T>;
export type ChoiceValue = string;
export type ChoiceData = _DiscriminatedUnionFromArray<
  typeof choiceTypes,
  {
    arbitrary: {};
    actionId: {};
    cardId: {};
    chipId: {};
    playerId: {};
  },
  {
    name: string;
    choosingPlayerId: Id;
    instructions: string;
    values: ChoiceValue[];
    min: number;
    max: number | null;
  }
>;
/** When an activity requires multiple choices, all but the first may be "dependent" on previous choices made during the activity. */
export type NextChoiceData =
  | { type: "dependent"; index: number }
  | { type: "independent"; choice: ChoiceData };

export type Decision = { name: string; playerId: Id; values: ChoiceValue[] };

export type ActivityType = _UnionFromArray<typeof activityTypes>;
export type ActivityTypeMap<T> = _MapFromArray<typeof activityTypes, T>;
export type ActivityData = _DiscriminatedUnionFromArray<
  typeof activityTypes,
  {
    drawingCards: {};
    choosingAction: { playerChoosingActionId: Id };
    takingAction: {
      actionId: Id;
      playerTakingActionId: Id;
    };
  },
  {
    currentChoice: ChoiceData;
    nextChoices: NextChoiceData[];
    previousDecisions: Decision[];
  }
>;

export type GameData = {
  playerTakingTurnId: Id;
  activity: ActivityData;
  actions: ActionData[];
  players: PlayerData[];
  cards: CardData[];
  chips: ChipData[];
};
