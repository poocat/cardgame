import { errorHandler } from "@server/api/middleware";
import {
  cardsRouter,
  copyRouter,
  gamesRouter,
  roomsRouter,
} from "@server/api/routes";
import { CONFIG } from "@server/config";
import { initDb } from "@server/db/database";
import { useExampleCards, usePrivateCards } from "@server/game/cards/registry";
import { logger } from "@server/logger";
import { useDefaultLocales, usePrivateLocales } from "@server/text/registry";
import express from "express";

export async function startServer() {
  logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server starting");

  let data = null;
  try {
    data = await initDb({ uri: CONFIG.mongoDbUri, dbName: CONFIG.mongoDbName });
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

  try {
    usePrivateLocales();
  } catch (error) {
    logger.warn({ error }, "could not load private locales");
    useDefaultLocales();
  }

  const app = express();
  app.use(express.json());

  app.use(
    cardsRouter.path,
    cardsRouter.create({ privatePath: CONFIG.privatePath }),
  );
  app.use(
    copyRouter.path,
    copyRouter.create({ privatePath: CONFIG.privatePath }),
  );
  app.use(
    gamesRouter.path,
    gamesRouter.create({ repositories: data.repositories }),
  );
  app.use(
    roomsRouter.path,
    roomsRouter.create({ repositories: data.repositories }),
  );

  // Global error handling:
  app.use(errorHandler);

  app.listen(CONFIG.port, () => {
    logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server listening");
  });
}
