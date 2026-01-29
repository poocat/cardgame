/**
 * Contains transformations of database models into "digests" that will
 */

import type {
  choiceValueDigestSchema,
  gameDigestSchema,
  inPlayCardDigestSchema,
  roomDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import type { RoomDoc } from "@server/db/types";
import type { CardData, Decision, GameData, Id } from "@server/types";
import { createHash } from "node:crypto";
import type z from "zod";

type RoomData = RoomDoc["data"];

type GameDigest = z.infer<typeof gameDigestSchema>;
type RoomDigest = z.infer<typeof roomDigestSchema>;
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
  gameData.players.forEach((p) => {
    anonymizedPlayerIdMap[p.id] =
      p.id === playerId ? p.id : anonymizeId(p.id, anonymizationSalt);
  });

  const otherPlayerData = gameData.players.filter((p) => p.id !== playerId);
  const observingPlayerData = gameData.players.find((p) => p.id === playerId);

  function visibleCardDigest(
    cardData: CardData,
  ): z.infer<typeof visibleCardDigestSchema> {
    return {
      id: cardData.id,
      name: cardData.name,
      type: cardData.type,
      lastMovedOnTick: cardData.lastMovedOnTick,
      actions: gameData.actions
        .filter((a) => a.card.id === cardData.id)
        .map((a) => ({ id: a.id, type: a.type, instructions: a.instructions })),
      chips: gameData.chips
        .filter(
          (c) =>
            c.location.type === "onCard" && c.location.cardId === cardData.id,
        )
        .map((c) => ({ id: c.id })),
    };
  }

  function cardInPlayDigest(
    cardData: CardData,
  ): z.infer<typeof inPlayCardDigestSchema> {
    return {
      ...visibleCardDigest(cardData),
      exhausted:
        cardData.location.type === "inPlay" && cardData.location.exhausted,
    };
  }

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
    case "cardId": {
      choiceValuesDigest.push(
        ...choiceValues.map((v) => {
          const card = gameData.cards.find((c) => c.id === v);
          const label =
            card?.location.type === "inDeck"
              ? "Card in Deck"
              : (card?.name ?? v);
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

  const digest: GameDigest = {
    playerTakingTurnId: gameData.playerTakingTurnId,
    activity: {
      type: gameData.activity.type,
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
        cardsInDeck: gameData.cards
          .filter(
            (c) => c.ownerId === playerData.id && c.location.type === "inDeck",
          )
          .map((c) => ({
            id: c.id,
          })),
        cardsInHand: gameData.cards
          .filter(
            (c) => c.ownerId === playerData.id && c.location.type === "inHand",
          )
          .map((c) => ({
            id: c.id,
          })),
        cardsInPlay: gameData.cards
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
      };
    }),
  };

  if (observingPlayerData) {
    digest.observingPlayer = {
      id: observingPlayerData.id,
      name: observingPlayerData.name,
      cardsInDeck: gameData.cards
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inDeck",
        )
        .map((c) => ({
          id: c.id,
        })),
      cardsInHand: gameData.cards
        .filter(
          (c) =>
            c.ownerId === observingPlayerData.id &&
            c.location.type === "inHand",
        )
        .map((c) => visibleCardDigest(c)),
      cardsInPlay: gameData.cards
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
