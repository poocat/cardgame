import { ObjectId } from "mongodb";
import z from "zod";
import { getCollection } from "@server/db/database";
import { documentMetaSchema, makeDocumentMeta, makeId } from "@server/db/meta";

type PlayerData = { id: string; name: string };
// TODO!!! I don't want to export this!!!
export type RoomData = {
  gameId: string | null;
  host: PlayerData;
  guests: PlayerData[];
};
type RoomDbDocument = {
  _id: ObjectId;
  meta: z.infer<typeof documentMetaSchema>;
  data: RoomData;
};

export async function findRoom(
  roomId: string,
): Promise<{ room: RoomDbDocument | undefined }> {
  const collection = getCollection("rooms");
  const result = await collection.findOne({ "meta.id": { $eq: roomId } });
  if (!result) return { room: undefined };
  const { ...room } = result;
  return { room: room as RoomDbDocument };
}

export async function insertRoomWithHost(
  hostName: string,
): Promise<{ roomId: string; hostId: string }> {
  const hostId = makeId();
  const collection = getCollection("rooms");
  const doc: Omit<RoomDbDocument, "_id"> = {
    meta: makeDocumentMeta(),
    data: {
      gameId: null,
      host: {
        id: hostId,
        name: hostName,
      },
      guests: [],
    },
  };
  const result = await collection.insertOne(doc);
  // TODO!!! Catch errors!!!
  return { roomId: doc.meta.id, hostId };
}

export async function updateRoomGameId(roomId: string, gameId: string) {
  const now = new Date().toISOString();
  const collection = getCollection("rooms");
  const result = await collection.updateOne(
    { "meta.id": { $eq: roomId } },
    {
      $set: { "meta.updatedAt": now, "data.gameId": gameId },
    },
  );
  // TODO!!! Handle Errors!!!
}

export async function updateRoomAddGuest(
  roomId: string,
  guestName: string,
): Promise<{ guestId: string }> {
  const now = new Date().toISOString();
  const guestId = makeId();
  const collection = getCollection("rooms");
  const result = await collection.updateOne(
    { "meta.id": { $eq: roomId } },
    {
      $set: { "meta.updatedAt": now },
      $addToSet: { "data.guests": { id: guestId, name: guestName } },
    },
  );
  // TODO!!! Handle Errors!!!
  return { guestId };
}
