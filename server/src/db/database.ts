import { MongoClient, Db, Collection } from "mongodb";
import { CONFIG } from "@server/config";

const collectionNames = {
  games: "games",
  rooms: "rooms",
} as const;
type CollectionName = keyof typeof collectionNames;

let db: Db;

export async function initDb() {
  const mongoConnectionString = `${CONFIG.mongoDbUri}/${CONFIG.mongoDbName}`;
  try {
    const mongoClient = await MongoClient.connect(mongoConnectionString);
    db = mongoClient.db(CONFIG.mongoDbName);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process on connection failure
  }
}

export function getCollection(name: CollectionName): Collection {
  if (!db) {
    throw new Error("Database not initialized.");
  }
  return db.collection(collectionNames[name]);
}
