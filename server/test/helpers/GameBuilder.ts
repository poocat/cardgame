/**
 * A builder for creating deterministic GameData objects for testing.
 *
 * Usage:
 *   const game = new GameBuilder()
 *     .addPlayer("alice")
 *     .addPlayer("bob")
 *     .addCard({ owner: "alice", name: "Example Producer", location: { type: "inHand" } })
 *     .addChip({ owner: "alice", location: { type: "inReserve" } })
 *     .setActivity({ ... })
 *     .build();
 */

import { CONSTANTS } from "@common/game/constants";
import { getCardDefinition } from "@server/game/cards/registry";
import { testCards } from "../fixtures/cards";
import type {
  ActionData,
  ActionType,
  ActivityData,
  CardData,
  CardLocationData,
  ChipData,
  ChipLocationData,
  GameData,
  Id,
  PlayerData,
} from "@server/types";

type CardSpec = {
  name: string;
  owner: Id;
  location: CardLocationData;
  /** If omitted, an id will be generated from the name, owner, and insert order. */
  id?: Id;
};

type ChipSpec = {
  owner: Id;
  location: ChipLocationData;
  /** If omitted, an id will be generated from the owner and insert order. */
  id?: Id;
};

type ActivitySpec =
  | {
      type: "literal";
      activity: ActivityData;
    }
  | {
      type: "action";
      cardId: Id;
      actionType: ActionType;
    };

/******************************************************************************
 * ### GameBuilder
 *
 * A utility for building game data for the purposes of testing.
 *
 * Note, if the activity is not set, will default to "choosingAction" for the
 * first player added to the game.
 ******************************************************************************/
export class GameBuilder {
  private players: Map<string, PlayerData> = new Map();
  private cardSpecs: CardSpec[] = [];
  private chipSpecs: ChipSpec[] = [];
  private activitySpec: ActivitySpec | null = null;
  private playerTakingTurnId: string | null = null;
  private tick: number = 0;
  private turn: number = 0;

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Add a player to the game.The given nickname can be used to refer to this
   * player in sebsequent method calls.
   *
   * Also serves as the unique id of the player, and thus should be different
   * for different players.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  addPlayer(nickname: string): this {
    this.players.set(nickname, {
      id: nickname,
      name: nickname,
      turnCount: 0,
    });
    return this;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Set which player starts the game.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  setPlayerTakingTurn(nickname: string): this {
    this.playerTakingTurnId = nickname;
    return this;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Adds a card to the game.
   *
   * If no id provided, will generate one automatically when the game is built.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  addCard(spec: CardSpec): this {
    this.cardSpecs.push(spec);
    return this;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Adds a chip to the game.
   *
   * If no id provided, will generate one automatically when the game is built.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  addChip(spec: ChipSpec): this {
    this.chipSpecs.push(spec);
    return this;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Add N chips to the reserve for the given player.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  addChipsInReserve(owner: string, count: number): this {
    for (let i = 0; i < count; i++) {
      this.chipSpecs.push({ owner, location: { type: "inReserve" } });
    }
    return this;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to specify the activity of the game to the given value.
   *
   * If no activity is set, the default will be a "choosingAction" activity for
   * the first player added to the game.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  setActivity(activity: ActivityData): this {
    this.activitySpec = { type: "literal", activity };
    return this;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to specify the activity of the game to a "takingAction" activity,
   * based on the given card id and action type.
   *
   * If no activity is set, the default will be a "choosingAction" activity for
   * the first player added to the game.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  setUpActionActivity(cardId: Id, actionType: ActionType): this {
    this.activitySpec = { type: "action", cardId, actionType };
    return this;
  }

  setTick(tick: number): this {
    this.tick = tick;
    return this;
  }

  setTurn(turn: number): this {
    this.turn = turn;
    return this;
  }

  build(): GameData {
    let chipCount = 0;
    let cardCount = 0;
    let actionCount = 0;

    if (this.players.size === 0) {
      throw new Error("Must add at least one player.");
    }

    const playerData = [...this.players.values()];
    const playerTakingTurnId = this.playerTakingTurnId ?? playerData[0].id;

    // Build cards
    const cards: CardData[] = this.cardSpecs.map((spec) => {
      const cardDef = getCardDefinition(spec.name);
      if (!cardDef) {
        throw new Error(`Unknown card name: "${spec.name}".`);
      }
      const id = spec.id ?? `card-${cardCount++}-${spec.owner}-${spec.name}`;
      return {
        id,
        name: spec.name,
        type: cardDef.type,
        ownerId: spec.owner,
        location: spec.location,
        lastMovedOnTick: 0,
        lastMovedOnTurn: 0,
      };
    });

    // Build chips
    const chips: ChipData[] = this.chipSpecs.map((spec) => {
      const id = spec.id ?? `chip-${chipCount++}`;
      return {
        id,
        ownerId: spec.owner,
        location: spec.location,
      };
    });

    // Build actions from card definitions
    const actions: ActionData[] = [];
    for (const card of cards) {
      const cardDef = getCardDefinition(card.name);
      if (!cardDef) continue;
      for (const [actionType, actionDef] of Object.entries(cardDef.actions)) {
        if (!actionDef) continue;
        actions.push({
          id: `action-${actionCount++}`,
          type: actionType as ActionType,
          card: { id: card.id, name: card.name, ownerId: card.ownerId },
          instructions: actionDef.instructions ?? "",
        });
      }
    }

    // Build the activity from the given spec, or use the default
    // "choosingAction" activity.
    const activity: ActivityData = (() => {
      switch (this.activitySpec?.type) {
        case "literal": {
          return this.activitySpec.activity;
        }
        case "action": {
          const { cardId, actionType } = this.activitySpec;
          const action = actions.find(
            (a) => a.card.id === cardId && a.type === actionType,
          );
          if (!action) {
            throw new Error(
              `Could not find action ${actionType} on card ${cardId}.`,
            );
          }
          return {
            type: "choosingAction",
            playerChoosingActionId: "alice",
            currentChoice: {
              name: "actionToTake",
              type: "actionId",
              choosingPlayerId: "alice",
              instructions: "Choose an action.",
              values: [action.id],
              min: 0,
              max: 1,
            },
            nextChoices: [],
            previousDecisions: [],
          };
        }
        default: {
          return {
            type: "choosingAction",
            playerChoosingActionId: playerTakingTurnId,
            currentChoice: {
              name: "actionToTake",
              type: "actionId",
              choosingPlayerId: playerTakingTurnId,
              instructions: "Choose an action.",
              values: [],
              min: 0,
              max: 1,
            },
            nextChoices: [],
            previousDecisions: [],
          };
        }
      }
    })();

    return {
      tick: this.tick,
      turn: this.turn,
      playerTakingTurnId,
      activity,
      actions,
      players: playerData,
      cards,
      chips,
      wins: [],
    };
  }
}

/******************************************************************************
 * ### buildBasicGame
 *
 * Builds a minimal, 2-player game with alice ready to draw her first card.
 ******************************************************************************/
export function buildBasicGame(): GameData {
  const builder = new GameBuilder()
    .addPlayer("alice")
    .addPlayer("bob")
    .setPlayerTakingTurn("alice");

  for (const player of ["alice", "bob"]) {
    for (const cardDef of Object.values(testCards)) {
      builder.addCard({
        owner: player,
        name: cardDef.name,
        location: { type: "inDeck" },
      });
    }
    builder.addChipsInReserve(player, CONSTANTS.numChipsPerPlayer);
  }

  // Build without activity first to get actual card IDs
  const game = builder.build();

  // Find alice's first card in deck
  const aliceFirstCard = game.cards.find(
    (c) => c.ownerId === "alice" && c.location.type === "inDeck",
  );

  // Set up initial drawing activity with the actual card ID
  game.activity = {
    type: "drawingCards",
    currentChoice: {
      name: "cardToDraw",
      type: "cardId",
      values: aliceFirstCard ? [aliceFirstCard.id] : [],
      min: 1,
      max: 1,
      choosingPlayerId: "alice",
      instructions: "Choose your first card to draw.",
    },
    nextChoices: [],
    previousDecisions: [],
  };

  return game;
}

/******************************************************************************
 * ### findActionId
 *
 * Helper to find an action id in game data given a card id and action type.
 ******************************************************************************/
export function findActionId(
  gameData: GameData,
  cardId: string,
  actionType: ActionType,
): string {
  const action = gameData.actions.find(
    (a) => a.card.id === cardId && a.type === actionType,
  );
  if (!action) {
    throw new Error(`No ${actionType} action found for card ${cardId}`);
  }
  return action.id;
}
