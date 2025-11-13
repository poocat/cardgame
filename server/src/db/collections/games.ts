import { ObjectId } from "mongodb";
import z from "zod";
import { GameData } from "@common/game/types";
import { getCollection } from "@server/db/database";
import { documentMetaSchema, makeDocumentMeta } from "@server/db/meta";

type GameDbDocument = {
  _id: ObjectId;
  meta: z.infer<typeof documentMetaSchema>;
  data: GameData;
};

export async function findGame(
  id: string,
): Promise<{ game: GameDbDocument | undefined }> {
  const collection = getCollection("games");
  const result = await collection.findOne({ "meta.id": { $eq: id } });
  if (!result) return { game: undefined };
  const { ...game } = result;
  return { game: result as GameDbDocument };
}

export async function findGames(): Promise<{ games: GameDbDocument[] }> {
  const collection = getCollection("games");
  const games = await collection.find({}).toArray();
  return { games: games as GameDbDocument[] };
}

export async function insertGame(
  gameData: GameData,
): Promise<{ gameId: string }> {
  const doc: Omit<GameDbDocument, "_id"> = {
    meta: makeDocumentMeta(),
    data: gameData,
  };
  const collection = getCollection("games");
  const result = await collection.insertOne(doc);
  // TODO!!! Catch errors!!!
  return { gameId: doc.meta.id };
}

export async function updateGameData(gameId: string, gameData: GameData) {
  const now = new Date().toISOString();
  const collection = getCollection("games");
  const result = await collection.updateOne(
    { "meta.id": { $eq: gameId } },
    { $set: { data: gameData, "meta.updatedAt": now } },
  );
  // TODO!!! Catch errors!!!
}
