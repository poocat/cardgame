import { GameData } from "@common/game/types";
import { createHash } from "crypto";

type DbDocumentMeta = {
  _id: string;
  createdAt: string;
  updatedAt: string;
};
type GameDbDocument = DbDocumentMeta & {
  data: GameData;
};
export const allGames: GameDbDocument[] = [];

type PlayerData = { id: string; name: string };
type RoomData = {
  host: PlayerData;
  guests: PlayerData[];
};
type RoomDbDocument = DbDocumentMeta & {
  gameId: string | null;
  data: RoomData;
};
export const allRooms: RoomDbDocument[] = [];

export function makeId(date: Date): string {
  return date.getTime().toString();
}

export function makeGameEtag(game: GameDbDocument, playerId?: string): string {
  const { updatedAt } = game;
  const base = playerId ? `${updatedAt}-${playerId}` : `${updatedAt}`;
  return `"${createHash("sha1").update(base).digest("base64")}"`;
}

export function makeRoomEtag(room: RoomDbDocument, playerId?: string): string {
  const { updatedAt } = room;
  const base = playerId ? `${updatedAt}-${playerId}` : `${updatedAt}`;
  return `"${createHash("sha1").update(base).digest("base64")}"`;
}
