import { MongoClient, Db } from "mongodb";
import { CONFIG } from "@server/config";
import { migrations, collectionNames } from "@server/db/migrations";
import { Repo } from "@server/db/utils/Repo";
import { GameDoc, RoomDoc } from "@server/db/types";

let db: Db;

export async function runMigrations(db: Db): Promise<void> {
  const migrationsCollection = db.collection("_migrations");
  await migrationsCollection.createIndex({ version: 1 }, { unique: true });

  for (const migration of migrations) {
    const applied = await migrationsCollection.findOne({
      version: migration.version,
    });
    if (!applied) {
      await migration.up(db);
      await migrationsCollection.insertOne({
        version: migration.version,
        name: migration.name,
        appliedAt: new Date().toISOString(),
      });
      console.log(`Applied migration ${migration.version}: ${migration.name}`);
    }
  }
  console.log("All migrations up to date");
}

export async function initDb() {
  const mongoConnectionString = `${CONFIG.mongoDbUri}/${CONFIG.mongoDbName}`;
  try {
    const mongoClient = await MongoClient.connect(mongoConnectionString);
    db = mongoClient.db(CONFIG.mongoDbName);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
  runMigrations(db);
}

export function getRepositories() {
  if (!db) {
    throw new Error("Database not initialized.");
  }
  return {
    games: new Repo(db.collection<GameDoc>(collectionNames.games)),
    rooms: new Repo(db.collection<RoomDoc>(collectionNames.rooms)),
  };
}
