import { ROUTES } from "@common/api/routes";
import { errorHandler } from "@server/api/middleware";
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

  app.use(ROUTES.cards.path, cards);
  app.use(ROUTES.games.path, games);
  app.use(ROUTES.rooms.path, rooms);

  // Global error handling:
  app.use(errorHandler);

  app.listen(CONFIG.port, () => {
    logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server listening");
  });
}
