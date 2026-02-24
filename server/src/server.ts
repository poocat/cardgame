import { ROUTES } from "@common/api/routes";
import {
  burstLimiter,
  errorHandler,
  pollSlowdown,
  sustainedLimiter,
} from "@server/api/middleware";
import { cards, games, rooms } from "@server/api/routes";
import { CONFIG } from "@server/config";
import { initDb } from "@server/db/database";
import { logger } from "@server/logger";
import express from "express";
import { useExampleCards, usePrivateCards } from "./game/cards/registry";

export async function startServer() {
  logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server starting");

  try {
    await initDb();
  } catch (error) {
    logger.error({ error }, "failed to initialize server");
    process.exit(1);
  }

  try {
    usePrivateCards();
  } catch (error) {
    logger.warn({ error }, "could not load private card registry");
    useExampleCards();
  }

  const app = express();
  app.use(express.json());

  // Cards (static assets):
  app.use(ROUTES.cards.path, burstLimiter);
  app.use(ROUTES.cards.path, cards);
  // Games:
  app.use(ROUTES.games.path, burstLimiter);
  app.use(ROUTES.games.path, sustainedLimiter);
  app.use(ROUTES.games.path, pollSlowdown);
  app.use(ROUTES.games.path, games);
  // Rooms:
  app.use(ROUTES.rooms.path, burstLimiter);
  app.use(ROUTES.rooms.path, sustainedLimiter);
  app.use(ROUTES.rooms.path, pollSlowdown);
  app.use(ROUTES.rooms.path, rooms);

  // Global error handling:
  app.use(errorHandler);

  app.listen(CONFIG.port, () => {
    logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server listening");
  });
}
