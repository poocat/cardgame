import { GameData } from "@common/game/types";

type GameDbDocument = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  data: GameData;
};
export const allGames: GameDbDocument[] = [];

type PlayerData = { id: string; name: string };
type RoomData = {
  host: PlayerData;
  guests: PlayerData[];
};
type RoomDbDocument = {
  _id: string;
  createdAt: string;
  updatedAt: string;
  gameId: string | null;
  data: RoomData;
};
export const allRooms: RoomDbDocument[] = [];

export function makeId(date: Date): string {
  return date.getTime().toString();
}
