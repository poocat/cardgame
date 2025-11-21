import express from "express";
import { ROUTES } from "@common/api/routes";
import { games, rooms } from "@server/api/routes";
import { CONFIG } from "@server/config";
import { initDb } from "@server/db/database";
import { logger } from "@server/logger";

export async function startServer() {
  logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server starting");

  await initDb();

  const app = express();
  app.use(express.json());

  // Routes:
  app.use(ROUTES.games.path, games);
  app.use(ROUTES.rooms.path, rooms);

  app.listen(CONFIG.port, () => {
    logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server listening");
  });
}
