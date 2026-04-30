import { collectionNames, migrations } from "@server/db/migrations";
import type { GameDoc, RoomDoc } from "@server/db/types";
import { logger } from "@server/logger";
import type { GameData, RoomData } from "@server/types";
import type { Db } from "mongodb";
import { MongoClient } from "mongodb";
import { GameRepository, RoomRepository } from "./repositories";

async function runMigrations(db: Db): Promise<void> {
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

/******************************************************************************
 * ### initDb
 *
 * Connect to the indicated MongoDB instance, attempt migrations, and return
 * various handles to data access layer.
 ******************************************************************************/
export async function initDb(args: { uri: string; dbName: string }): Promise<{
  repositories: {
    games: GameRepository<GameData>;
    rooms: RoomRepository<RoomData>;
  };
}> {
  const client = await MongoClient.connect(`${args.uri}/${args.dbName}`);
  const db = client.db(args.dbName);
  logger.info({ dbName: db.databaseName }, "database connected");
  await runMigrations(db);
  return {
    repositories: {
      games: new GameRepository(db.collection<GameDoc>(collectionNames.games)),
      rooms: new RoomRepository(db.collection<RoomDoc>(collectionNames.rooms)),
    },
  };
}
