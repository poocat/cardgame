import { errorHandler } from "@server/api/middleware";
import {
  cardsRouter,
  copyRouter,
  gamesRouter,
  healthRouter,
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

  // Initialize db:
  const data = await initDb({
    uri: CONFIG.mongoDbUri,
    dbName: CONFIG.mongoDbName,
  }).catch((error) => {
    logger.error({ error }, "failed to initialize server");
    process.exit(1);
  });

  // Load cards, attempting to import from private submodule:
  try {
    usePrivateCards();
  } catch (error) {
    logger.warn({ error }, "could not load private card registry");
    useExampleCards();
  }

  // Load locales, attempting to import from private submodule:
  try {
    usePrivateLocales();
  } catch (error) {
    logger.warn({ error }, "could not load private locales");
    useDefaultLocales();
  }

  // Build the server app:
  const app = express();

  app.use(healthRouter.path, healthRouter.create());

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
  app.use(errorHandler);

  // Start the server:
  const server = app.listen(CONFIG.port, () => {
    logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server listening");
  });

  // Configure gracegful shutdown:
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "shutting down gracefully");

    // Force exit with nonzero status if shutdown takes too long.
    const forceExit = setTimeout(() => {
      logger.error("shutdown took too long, forcing exit");
      process.exit(1);
    }, 10000);
    forceExit.unref();

    // Close the server, waiting for any existing connections to end.
    await new Promise<void>((resolve) => server.close(() => resolve()));

    // Close the database connection.
    await data.close();

    logger.info("shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
