/**
 * Establishes:
 * - the names of the MongoDB collections
 * - the indexes necessary to use the "repository" pattern
 */
import type { Db } from "mongodb";

export const collectionNames = {
  games: "games",
  rooms: "rooms",
};

type Migration = {
  version: number;
  name: string;
  up: (db: Db) => Promise<void>;
};

export const migrations: Migration[] = [
  {
    version: 1,
    name: "create_initial_indexes",
    up: async (db: Db) => {
      for (const collectionName of Object.values(collectionNames)) {
        await db
          .collection(collectionName)
          .createIndex(
            { "meta.id": 1 },
            { unique: true, name: "meta_id_unique" },
          );
        await db
          .collection(collectionName)
          .createIndex(
            { "meta.id": 1, "meta.version": 1 },
            { name: "meta_id_version" },
          );
        await db
          .collection(collectionName)
          .createIndex({ "meta.updatedAt": -1 }, { name: "updated_at_desc" });
      }
    },
  },
];
