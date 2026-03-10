/**
 * Transformers modify data on their way into and out of the API layer.
 *
 * For instance:
 * - Game data, which is relatively "flat", is transformed to a nested object
 *   that more easily corresponds to how the game data is presented.
 * - Private user ids need to be anonymized, to prevent cheating.
 * - Anonymized ids need to be deanonymized before being passed to the state
 *   machine.
 */

import { createHash } from "node:crypto";
import type {
  choiceValueDigestSchema,
  gameDigestSchema,
  inPlayCardDigestSchema,
  roomDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import { actionTypes } from "@common/game/enums";
import type { RoomDoc } from "@server/db/types";
import type { CardData, Decision, GameData, Id } from "@server/types";
import type z from "zod";

type RoomData = RoomDoc["data"];

type GameDigest = z.infer<typeof gameDigestSchema>;
type RoomDigest = z.infer<typeof roomDigestSchema>;
type VisibleCardDigest = z.infer<typeof visibleCardDigestSchema>;
type InPlayCardDigest = z.infer<typeof inPlayCardDigestSchema>;
type ChoiceValuesDigest = z.infer<typeof choiceValueDigestSchema>;

function anonymizeId(id: string, salt: string): string {
  const base = `${id}:${salt}`;
  const hash = createHash("sha256").update(base).digest("hex");

  // UUID version 4 consists of 32 hexadecimal digits in the form:
  // 8-4-4-4-12 (total 36 characters including hyphens)
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    `4${hash.substring(12, 15)}`, // Set the version to 4
    `8${hash.substring(15, 18)}`, // Set the variant to 8 (RFC 4122)
    hash.substring(18, 30),
  ].join("-");

  return uuid;
}

function createActivityExplanation(gameData: GameData): string {
  const choosingPlayerId = gameData.activity.currentChoice.choosingPlayerId;
  const choosingPlayer = gameData.players.find(
    (p) => p.id === choosingPlayerId,
  );
  const choosingPlayerName = choosingPlayer?.name;
  switch (gameData.activity.type) {
    case "choosingAction": {
      return `${choosingPlayerName} is choosing which action to take, or whether or not to pass their turn.`;
    }
    case "drawingCards": {
      return `${choosingPlayerName} is choosing which deck to draw from.`;
    }
    case "takingAction": {
      const actionId = gameData.activity.actionId;
      const playerTakingActionId = gameData.activity.playerTakingActionId;
      const playerTakingAction = gameData.players.find(
        (p) => p.id === playerTakingActionId,
      );
      const action = gameData.actions.find((a) => a.id === actionId);
      return `${playerTakingAction?.name} has chosen the ${action?.type} action from ${action?.card.name}. ${choosingPlayerName} is currently choosing values.`;
    }
    default: {
      return "";
    }
  }
}

/******************************************************************************
 * ### digestGameData
 *
 * Transforms game data for better consumption by the front end, and anonymizes
 * private values like other player ids.
 ******************************************************************************/
export function digestGameData({
  gameData,
  anonymizationSalt,
  playerId,
}: {
  gameData: GameData;
  anonymizationSalt: string;
  /* The id of the player requesting the data. Undefined for a spectator. */
  playerId?: Id;
}): GameDigest {
  const anonymizedPlayerIdMap: Record<Id, Id> = {};
  const playerNameMap: Record<Id, string> = {};
  gameData.players.forEach((p) => {
    anonymizedPlayerIdMap[p.id] =
      p.id === playerId ? p.id : anonymizeId(p.id, anonymizationSalt);
    playerNameMap[p.id] = p.name;
  });

  const otherPlayerData = gameData.players.filter((p) => p.id !== playerId);
  const observingPlayerData = gameData.players.find((p) => p.id === playerId);

  // Construct an annotation map.
  const annotationMap: Record<Id, string[]> = {};
  gameData.annotations.forEach(({ id, message }) => {
    const match = annotationMap[id];
    if (match) match.push(message);
    else annotationMap[id] = [message];
  });

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to create digests for cards that are visible to the observing player.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  function visibleCardDigest(cardData: CardData): VisibleCardDigest {
    // Actions should be displayed in order.
    const cardActions = gameData.actions.filter(
      (a) => a.card.id === cardData.id,
    );
    const actions: VisibleCardDigest["actions"] = [];
    for (const type of actionTypes) {
      const match = cardActions.find((a) => a.type === type);
      if (match)
        actions.push({
          id: match.id,
          type,
          instructions: match.instructions,
          annotations: annotationMap[match.id] ?? [],
        });
    }

    return {
      id: cardData.id,
      name: cardData.name,
      triggerInstructions: cardData.triggerInstructions,
      type: cardData.type,
      lastMovedOnTurn: cardData.lastMovedOnTurn,
      lastMovedOnTick: cardData.lastMovedOnTick,
      actions,
      chips: gameData.chips
        .filter(
          (c) =>
            c.location.type === "onCard" && c.location.cardId === cardData.id,
        )
        .map((c) => ({ id: c.id })),
    };
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Use to create digests for cards in play.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  function cardInPlayDigest(cardData: CardData): InPlayCardDigest {
    return {
      ...visibleCardDigest(cardData),
      exhausted:
        cardData.location.type === "inPlay" && cardData.location.exhausted,
    };
  }

  // Cards should be ordered based on how long they have been at their current
  // location.
  const allCards = [...gameData.cards];
  allCards.sort((a, b) => a.lastMovedOnTick - b.lastMovedOnTick);

  // The values for the current choice are anonymized and checked for
  // associations with cards.
  const choiceValues = gameData.activity.currentChoice.values;
  const choiceValuesDigest: ChoiceValuesDigest[] = [];
  switch (gameData.activity.currentChoice.type) {
    case "arbitrary": {
      choiceValuesDigest.push(
        ...choiceValues.map((v) => ({ value: v, onCardId: null, label: v })),
      );
      break;
    }
    case "deck": {
      choiceValuesDigest.push(
        ...choiceValues.map((v) => ({ value: v, onCardId: null, label: v })),
      );
      break;
    }
    case "cardId": {
      choiceValuesDigest.push(
        ...choiceValues.map((v) => {
          const card = allCards.find((c) => c.id === v);
          const label = card?.name ?? "Card";
          return { value: v, onCardId: null, label };
        }),
      );
      break;
    }
    case "playerId": {
      choiceValuesDigest.push(
        ...choiceValues.map((playerId) => {
          const player = gameData.players.find((p) => p.id === playerId);
          const label = player?.name ?? playerId;
          return {
            value: anonymizedPlayerIdMap[playerId],
            onCardId: null,
            label,
          };
        }),
      );
      break;
    }
    case "actionId": {
      gameData.actions
        .filter((a) => choiceValues.includes(a.id))
        .forEach((a) => {
          const label = `[${a.type}] ${a.card.name}`;
          choiceValuesDigest.push({ value: a.id, onCardId: a.card.id, label });
        });
      break;
    }
    case "chipId": {
      gameData.chips
        .filter((c) => choiceValues.includes(c.id))
        .forEach((c) => {
          const onCardId =
            c.location.type === "onCard" ? c.location.cardId : null;
          choiceValuesDigest.push({ value: c.id, onCardId, label: "Chip" });
        });
      break;
    }
  }

  const wins = gameData.wins.sort((a, b) => a.onTick - b.onTick);
  const winner =
    wins.length > 0
      ? {
          id: anonymizedPlayerIdMap[wins[0].playerId],
          name: playerNameMap[wins[0].playerId],
        }
      : null;

  const digest: GameDigest = {
    playerTakingTurnId: anonymizedPlayerIdMap[gameData.playerTakingTurnId],
    activity: {
      type: gameData.activity.type,
      explanation: createActivityExplanation(gameData),
      choice: {
        ...gameData.activity.currentChoice,
        values: choiceValuesDigest,
        choosingPlayerId:
          anonymizedPlayerIdMap[
            gameData.activity.currentChoice.choosingPlayerId
          ],
        instructions: gameData.activity.currentChoice.instructions,
      },
      previouslyChosenValues: gameData.activity.previousDecisions.flatMap(
        (d) => d.values,
      ),
    },
    otherPlayers: otherPlayerData.map((playerData) => {
      return {
        id: anonymizedPlayerIdMap[playerData.id],
        name: playerData.name,
        cardsInDeck: allCards
          .filter(
            (c) => c.ownerId === playerData.id && c.location.type === "inDeck",
          )
          .map((c) => ({
            id: c.id,
          })),
        cardsInHand: allCards
          .filter(
            (c) => c.ownerId === playerData.id && c.location.type === "inHand",
          )
          .map((c) => ({
            id: c.id,
          })),
        cardsInPlay: allCards
          .filter(
            (c) => c.ownerId === playerData.id && c.location.type === "inPlay",
          )
          .map((c) => cardInPlayDigest(c)),
        chipsInReserve: gameData.chips
          .filter(
            (c) =>
              c.ownerId === playerData.id && c.location.type === "inReserve",
          )
          .map((c) => ({ id: c.id })),
        chipsinChannel: gameData.chips
          .filter(
            (c) =>
              c.ownerId === playerData.id && c.location.type === "inChannel",
          )
          .map((c) => ({ id: c.id })),
      };
    }),
    playerOrder: gameData.players.map((p) => anonymizedPlayerIdMap[p.id]),
    winner,
  };

  if (observingPlayerData) {
    digest.observingPlayer = {
      id: observingPlayerData.id,
      name: observingPlayerData.name,
      cardsInDeck: allCards
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inDeck",
        )
        .map((c) => ({
          id: c.id,
        })),
      cardsInHand: allCards
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inHand",
        )
        .map((c) => visibleCardDigest(c)),
      cardsInPlay: allCards
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inPlay",
        )
        .map((c) => cardInPlayDigest(c)),
      chipsInReserve: gameData.chips
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inReserve",
        )
        .map((c) => ({ id: c.id })),
      chipsinChannel: gameData.chips
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inChannel",
        )
        .map((c) => ({ id: c.id })),
    };
  }
  return digest;
}

/******************************************************************************
 * ### deanonymizeDecision
 *
 * Transforms a decision that may include anonymized values by replacing
 * anonymized values with the corresponding private data.
 ******************************************************************************/
export function deanonymizeDecision({
  decision,
  anonymizationSalt,
  playerIds,
}: {
  decision: Decision;
  anonymizationSalt: string;
  playerIds: Id[];
}): Decision {
  const valueMap: Record<Id, Id> = {};
  playerIds.forEach((id) => {
    valueMap[anonymizeId(id, anonymizationSalt)] = id;
  });
  return {
    ...decision,
    values: decision.values.map((v) => valueMap[v] ?? v),
  };
}

/******************************************************************************
 * ### digestRoomData
 *
 * Transforms room data by anonymizing private values like other player ids.
 ******************************************************************************/
export function digestRoomData({
  roomData,
  anonymizationSalt,
  playerId,
}: {
  roomData: RoomData;
  anonymizationSalt: string;
  playerId?: Id;
}): RoomDigest {
  const allPlayers = [roomData.host, ...roomData.guests];
  const playerIdMap: Record<Id, Id> = {};
  allPlayers.forEach((p) => {
    playerIdMap[p.id] =
      p.id === playerId ? p.id : anonymizeId(p.id, anonymizationSalt);
  });
  return {
    host: {
      ...roomData.host,
      id: playerIdMap[roomData.host.id],
    },
    guests: roomData.guests.map((p) => ({
      ...p,
      id: playerIdMap[p.id],
    })),
  };
}
