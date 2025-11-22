import { CONFIG } from "@server/config";
import { collectionNames, migrations } from "@server/db/migrations";
import { Repository } from "@server/db/repository";
import type { GameDoc, RoomDoc } from "@server/db/types";
import { logger } from "@server/logger";
import type { Db } from "mongodb";
import { MongoClient } from "mongodb";

let db: Db;

export async function runMigrations(db: Db): Promise<void> {
  const migrationsCollection = db.collection("_migrations");
  await migrationsCollection.createIndex({ version: 1 }, { unique: true });

  let appliedCount = 0;
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
      logger.info(
        { version: migration.version, name: migration.name },
        "migration applied",
      );
      appliedCount++;
    }
  }
  logger.info({ count: appliedCount }, "all migrations applied");
}

export async function initDb() {
  const mongoConnectionString = `${CONFIG.mongoDbUri}/${CONFIG.mongoDbName}`;
  try {
    const mongoClient = await MongoClient.connect(mongoConnectionString);
    db = mongoClient.db(CONFIG.mongoDbName);
    logger.info({ dbName: db.databaseName }, "database connected");
    await runMigrations(db);
  } catch (error) {
    logger.error({ error }, "database connection failed");
    throw error;
  }
}

export function getRepositories() {
  if (!db) {
    throw new Error("Database not initialized.");
  }
  return {
    games: new Repository(db.collection<GameDoc>(collectionNames.games)),
    rooms: new Repository(db.collection<RoomDoc>(collectionNames.rooms)),
  };
}
