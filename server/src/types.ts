// biome-ignore lint/style/useImportType: these are used exclusively in `typeof` expressions, which require value imports, not type imports.
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
export type Tick = number;
export type Turn = number;

export type Message = {
  key: string;
  params?: Record<string, string | number | Message>;
};

export type ActionType = _UnionFromArray<typeof actionTypes>;
export type ActionTypeMap<T> = _MapFromArray<typeof actionTypes, T>;
export type ActionData = _DiscriminatedUnionFromArray<
  typeof actionTypes,
  {
    play: unknown;
    ability: unknown;
    discard: unknown;
  },
  {
    id: Id;
    // TODO!!! Name and owner are copies of card data. Should normalize.
    card: { id: Id; name: string; ownerId: Id };
  }
>;

export type ChipLocationType = _UnionFromArray<typeof chipLocationTypes>;
export type ChipLocationMap<T> = _MapFromArray<typeof chipLocationTypes, T>;
export type ChipLocationData = _DiscriminatedUnionFromArray<
  typeof chipLocationTypes,
  {
    inReserve: unknown;
    inChannel: unknown;
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
    inHand: unknown;
    inPlay: { exhausted: boolean };
    inDiscard: unknown;
    inDeck: unknown;
  }
>;

export type CardType = _UnionFromArray<typeof cardTypes>;
export type CardTypeMap<T> = _MapFromArray<typeof cardTypes, T>;
export type CardData = _DiscriminatedUnionFromArray<
  typeof cardTypes,
  {
    producer: unknown;
    consumer: unknown;
  },
  {
    id: Id;
    name: string;
    ownerId: Id;
    location: CardLocationData;
    lastMovedOnTick: Tick;
    lastMovedOnTurn: Turn;
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
    arbitrary: { labels?: Record<ChoiceValue, Message> };
    actionId: unknown;
    cardId: unknown;
    chipId: unknown;
    playerId: unknown;
  },
  {
    name: string;
    choosingPlayerId: Id;
    instructions: Message;
    values: ChoiceValue[];
    min: number;
    max: number | null;
  }
>;
/** Actions can precipitate multiple choices. All but the first are "dependent" on previous choices made during the activity. */
export type NextChoiceData = { index: number; playerId: Id };

export type Decision = { name: string; playerId: Id; values: ChoiceValue[] };

export type ActivityType = _UnionFromArray<typeof activityTypes>;
export type ActivityTypeMap<T> = _MapFromArray<typeof activityTypes, T>;
export type ActivityData = _DiscriminatedUnionFromArray<
  typeof activityTypes,
  {
    drawingCards: unknown;
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

export type WinData = {
  playerId: Id;
  onTick: Tick;
};

export type AnnotationData = {
  id: Id;
  message: Message;
};

export type GameData = {
  /** An integer count of how many times the game state has been updated, since the beginning of the game. */
  tick: Tick;
  /** An integer count of how many times the turn has been passed from one player to another. */
  turn: Turn;
  playerTakingTurnId: Id;
  activity: ActivityData;
  actions: ActionData[];
  players: PlayerData[];
  cards: CardData[];
  chips: ChipData[];
  wins: WinData[];
  annotations: AnnotationData[];
};

type RoomPlayer = { id: string; name: string };

export type RoomData = {
  gameId: string | null;
  host: RoomPlayer;
  guests: RoomPlayer[];
};
