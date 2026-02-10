import type { DeepReadonly, IAccessor } from "@server/game/types";
import type {
  ActionData,
  CardData,
  CardLocationType,
  CardType,
  ChipData,
  ChipLocationType,
  GameData,
  Id,
  PlayerData,
} from "@server/types";

/******************************************************************************
 * ### Accessor
 *
 * The accessor is a read-only version of the given game data, which does not
 * include the current activity.
 *
 * Includes a number of concise "getter" methods ease the definition of rules
 * and cards.
 ******************************************************************************/
export class Accessor implements IAccessor {
  private gameData: DeepReadonly<GameData>;
  public cards: DeepReadonly<CardData[]>;
  public players: DeepReadonly<PlayerData[]>;
  public chips: DeepReadonly<ChipData[]>;
  public actions: DeepReadonly<ActionData[]>;

  constructor(gameData: GameData) {
    this.gameData = gameData;
    this.cards = this.gameData.cards;
    this.players = this.gameData.players;
    this.chips = this.gameData.chips;
    this.actions = this.gameData.actions;
  }

  getPlayerTakingTurn() {
    const matches = this.gameData.players.filter(
      (p) => p.id === this.gameData.playerTakingTurnId,
    );
    if (matches.length === 1) {
      return matches[0];
    } else {
      throw new Error(`Expected 1 player taking turn, found ${matches.length}`);
    }
  }

  getActionById(args: { actionId: Id }) {
    const match = this.gameData.actions.find((a) => a.id === args.actionId);
    if (!match) {
      throw new Error(`Action '${args.actionId}' not in game.`);
    }
    return match;
  }

  getCardById(args: { cardId: Id }) {
    const match = this.gameData.cards.find((card) => card.id === args.cardId);
    if (!match) {
      throw new Error(`Card ${args.cardId} not in game.`);
    }
    return match;
  }

  getCards(args: {
    playerIds?: Id[];
    types?: CardType[];
    locationTypes?: CardLocationType[];
    exhausted?: boolean;
    minChips?: number;
    maxChips?: number;
    excludeIds?: Id[];
  }) {
    return this.gameData.cards.filter((c) => {
      // Easiest checks first.
      if (
        args.exhausted !== undefined &&
        c.location.type === "inPlay" &&
        c.location.exhausted !== args.exhausted
      ) {
        return false;
      }
      if (args.types !== undefined && !args.types.includes(c.type)) {
        return false;
      }
      if (
        args.locationTypes !== undefined &&
        !args.locationTypes.includes(c.location.type)
      ) {
        return false;
      }
      if (args.playerIds !== undefined && !args.playerIds.includes(c.ownerId)) {
        return false;
      }
      if (args.excludeIds?.includes(c.id)) {
        return false;
      }
      if (args.minChips !== undefined || args.maxChips !== undefined) {
        const min = args.minChips ?? 0;
        const max = args.maxChips ?? 9999;
        const numChipsOnCard = this.getChips({ cardIds: [c.id] }).length;
        if (numChipsOnCard < min || numChipsOnCard > max) {
          return false;
        }
      }
      return true;
    });
  }

  getChips(args: {
    playerIds?: Id[];
    locationTypes?: ChipLocationType[];
    cardIds?: Id[];
    excludeIds?: Id[];
  }) {
    return this.gameData.chips.filter((c) => {
      if (
        args.locationTypes !== undefined &&
        !args.locationTypes.includes(c.location.type)
      ) {
        return false;
      }
      if (args.playerIds !== undefined && !args.playerIds.includes(c.ownerId)) {
        return false;
      }
      if (args.excludeIds?.includes(c.id)) {
        return false;
      }
      if (
        args.cardIds !== undefined &&
        (c.location.type !== "onCard" ||
          !args.cardIds.includes(c.location.cardId))
      ) {
        return false;
      }
      return true;
    });
  }
}
