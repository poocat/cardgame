import { errorHandler } from "@server/api/middleware";
import {
  cardsRouter,
  copyRouter,
  gamesRouter,
  healthRouter,
  iconsRouter,
  roomsRouter,
} from "@server/api/routes";
import { localesRouter } from "@server/api/routes/locales/routes";
import { CONFIG } from "@server/config";
import { initDb } from "@server/db/database";
import { useExampleCards, usePrivateCards } from "@server/game/cards/registry";
import { logger } from "@server/logger";
import { useDefaultLocales, usePrivateLocales } from "@server/text/registry";
import cors from "cors";
import express from "express";
import { createPrivatePaths } from "./paths";

/******************************************************************************
 * ### startServer
 *
 * Reads configuration to start server and listen.
 ******************************************************************************/
export async function startServer() {
  logger.info({ port: CONFIG.port, env: CONFIG.nodeEnv }, "server starting");

  const paths = createPrivatePaths(CONFIG.privatePath);

  // Initialize db:
  const data = await initDb({
    uri: CONFIG.mongoDbUri,
    dbName: CONFIG.mongoDbName,
    enableMetaCache: CONFIG.enableMetaCache,
  }).catch((error) => {
    logger.error({ error }, "failed to initialize server");
    process.exit(1);
  });

  // Load cards, attempting to import from private submodule:
  try {
    usePrivateCards(paths.cards);
  } catch (error) {
    logger.warn({ error }, "could not load private card registry");
    useExampleCards();
  }

  // Load locales, attempting to import from private submodule:
  try {
    if (!paths.locales) throw new Error("No path to locales");
    usePrivateLocales(paths.locales);
  } catch (error) {
    logger.warn({ error }, "could not load private locales");
    useDefaultLocales();
  }

  // Build the server app:
  const app = express();
  if (CONFIG.trustProxyHops !== null) {
    app.set("trust proxy", CONFIG.trustProxyHops);
  }

  /**
   * CORS Policy:
   *
   * `ETag` is not a CORS-safelisted response header, so browsers hide it from
   * cross-origin JS unless it is explicitly exposed. Without this the poller
   * never sees the ETag and conditional GET silently degrades to always-200.
   *
   * `If-None-Match` is not a CORS-safelisted request header, so the conditional
   * GET poll triggers a preflight on every request. `maxAge` lets the browser
   * cache the preflight result and skip the OPTIONS round-trip while polling.
   * (Chrome caps this at 7200s, Firefox at 86400s; lower values are ignored
   * only if larger than the cap.)
   */
  app.use(
    cors({
      origin: CONFIG.allowedOrigins,
      exposedHeaders: ["ETag"],
      maxAge: 3600,
    }),
  );

  app.use(healthRouter.path, healthRouter.create());

  // Content endpoints:
  app.use(localesRouter.path, localesRouter.create());
  app.use(
    cardsRouter.path,
    cardsRouter.create({ cardImagesPath: paths.cardImages }),
  );
  app.use(copyRouter.path, copyRouter.create({ copyPath: paths.copy }));
  app.use(
    iconsRouter.path,
    iconsRouter.create({
      iconMapPath: paths.iconMap,
      iconFolderPath: paths.icons,
    }),
  );

  // Game data endpoints:
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

  // Configure graceful shutdown:
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
