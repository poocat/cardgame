/**
 * A builder for creating deterministic GameData objects for testing.
 *
 * Usage:
 *   const game = new GameBuilder()
 *     .addPlayer("alice")
 *     .addPlayer("bob")
 *     .addCard({ owner: "alice", name: "...", location: { type: "inHand" } })
 *     .addChip({ owner: "alice", location: { type: "inReserve" } })
 *     .setActivity({ ... })
 *     .build();
 */

import { actionTypes } from "@common/game/enums";
import { getCardDefinition } from "@server/game/cards/registry";
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

type ActionIdMap = Partial<Record<ActionType, string>>;

type CardSpec = {
  name: string;
  owner: Id;
  location: CardLocationData;
  /** If omitted, an id will be generated from the name, owner, and insert order. */
  id?: Id;
  actionIdMap?: ActionIdMap;
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
      actionId: Id;
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
   * player in subsequent method calls.
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
   *
   * If an action id map is given, will assign the given ids to the actions
   * with the given types.
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
   * Add N chips to the channel for the given player.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  addChipsInChannel(owner: string, count: number): this {
    for (let i = 0; i < count; i++) {
      this.chipSpecs.push({ owner, location: { type: "inChannel" } });
    }
    return this;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to specify the activity of the game to the given value.
   *
   * If no activity is set, the default will be a "choosingAction" activity for
   * the player currently taking their turn, but with no values to choose from.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  setActivity(activity: ActivityData): this {
    this.activitySpec = { type: "literal", activity };
    return this;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to set up a "choosingAction" activity, for the player currently taking
   * their turn, with a single value to choose from, being the given action id.
   *
   * If no activity is set, the default will be a "choosingAction" activity for
   * the player currently taking their turn, but with no values to choose from.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  setUpActionActivity(actionId: Id): this {
    this.activitySpec = { type: "action", actionId };
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

    const actionIdMap: Map<Id, ActionIdMap> = new Map();

    // Build cards.
    const cards: CardData[] = this.cardSpecs.map((spec) => {
      const cardDef = getCardDefinition(spec.name);
      if (!cardDef) {
        throw new Error(`Unknown card name: "${spec.name}".`);
      }
      const cardId =
        spec.id ?? `card-${cardCount++}-${spec.owner}-${spec.name}`;
      // Be sure to update the action id map.
      if (spec.actionIdMap) {
        actionIdMap.set(cardId, spec.actionIdMap);
      }
      return {
        id: cardId,
        name: spec.name,
        type: cardDef.type,
        ownerId: spec.owner,
        location: spec.location,
        lastMovedOnTick: 0,
        lastMovedOnTurn: 0,
        triggerInstructions: "",
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
      if (cardDef) {
        for (const actionType of actionTypes) {
          const actionDef = cardDef.actions[actionType];
          if (actionDef) {
            const actionId =
              actionIdMap.get(card.id)?.[actionType] ??
              `action-${actionCount++}`;
            actions.push({
              id: actionId,
              type: actionType as ActionType,
              card: { id: card.id, name: card.name, ownerId: card.ownerId },
              instructions: actionDef.instructions ?? "",
            });
          }
        }
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
          return {
            type: "choosingAction",
            playerChoosingActionId: playerTakingTurnId,
            currentChoice: {
              name: "actionToTake",
              type: "actionId",
              choosingPlayerId: playerTakingTurnId,
              instructions: "Choose an action.",
              values: [this.activitySpec.actionId],
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
