/**
 * Contains transformations of database models into "digests" that will
 */
import { createHash } from "crypto";
import z from "zod";
import {
  gameDigestSchema,
  inPlayCardDigestSchema,
  roomDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import { CardData, Decision, GameData, Id } from "@server/types";
import { RoomDoc } from "@server/db/types";

type RoomData = RoomDoc["data"];

type GameDigest = z.infer<typeof gameDigestSchema>;
type RoomDigest = z.infer<typeof roomDigestSchema>;

function anonymizeId(id: string, salt: string): string {
  const base = `${id}:${salt}`;
  const hash = createHash("sha256").update(base).digest("hex");

  // UUID version 4 consists of 32 hexadecimal digits in the form:
  // 8-4-4-4-12 (total 36 characters including hyphens)
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "4" + hash.substring(12, 15), // Set the version to 4
    "8" + hash.substring(15, 18), // Set the variant to 8 (RFC 4122)
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

  const valueMap = { ...anonymizedPlayerIdMap };

  const otherPlayerData = gameData.players.filter((p) => p.id !== playerId);
  const observingPlayerData = gameData.players.find((p) => p.id === playerId);

  function visibleCardDigest(
    cardData: CardData,
  ): z.infer<typeof visibleCardDigestSchema> {
    return {
      id: cardData.id,
      name: cardData.name,
      type: cardData.type,
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

  const digest: GameDigest = {
    playerTakingTurnId: gameData.playerTakingTurnId,
    activity: {
      type: gameData.activity.type,
      choice: {
        ...gameData.activity.currentChoice,
        values: gameData.activity.currentChoice.values.map(
          (v) => valueMap[v] ?? v,
        ),
        choosingPlayerId:
          anonymizedPlayerIdMap[
            gameData.activity.currentChoice.choosingPlayerId
          ],
        instructions: gameData.activity.currentChoice.instructions,
      },
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
