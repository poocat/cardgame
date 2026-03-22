import type { roomDigestSchema } from "@common/api/digests";
import { anonymizeId } from "@server/api/anonymization";
import type { RoomDoc } from "@server/db/types";
import type { Id } from "@server/types";
import type z from "zod";

type RoomData = RoomDoc["data"];
type RoomDigest = z.infer<typeof roomDigestSchema>;

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
