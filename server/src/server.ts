import express from "express";
import { ROUTES } from "@common/api/routes";
import { games, rooms } from "@server/api/routes";
import { CONFIG } from "@server/config";
import { initDb } from "@server/db/database";
import { logger } from "@server/logger";
import {
  burstLimiter,
  errorHandler,
  pollSlowdown,
  sustainedLimiter,
} from "@server/api/middleware";

export async function startServer() {
  logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server starting");

  await initDb();

  const app = express();
  app.use(express.json());

  // Rate limiting and slowdown:
  app.use(burstLimiter);
  app.use(sustainedLimiter);
  app.use(pollSlowdown);

  // Routes:
  app.use(ROUTES.games.path, games);
  app.use(ROUTES.rooms.path, rooms);

  // Error handling:
  app.use(errorHandler);

  app.listen(CONFIG.port, () => {
    logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server listening");
  });
}
