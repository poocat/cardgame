/**
 * In-memory MongoDB lifecycle helper for API tests.
 */
import { initDb } from "@server/db/database";
import { MongoMemoryServer } from "mongodb-memory-server";

let server: MongoMemoryServer | null = null;
let dbCounter = 0;

async function stopServer() {
  if (server) await server.stop();
}

async function ensureServer() {
  if (server) return server;
  server = await MongoMemoryServer.create();
  // Probably not necessary, as `mongo-memory-server` should handle its own
  // cleanup. But, just in case...
  process.on("beforeExit", stopServer);
  return server;
}

type TestDbOptions = {
  enableMetaCache?: boolean;
};

/******************************************************************************
 * ### testDb
 *
 * If in-memory database server not running, spins it up.
 *
 * Creates a fresh database and initializes it (with migrations, et cetera),
 * returning the same handle returned by `initDb`.
 ******************************************************************************/
export async function testDb(opts?: TestDbOptions) {
  const s = await ensureServer();
  dbCounter++;
  return initDb({
    uri: s.getUri(),
    dbName: `test_${process.pid}_${dbCounter}`,
    ...opts,
  });
}
