import express from "express";
import { ROUTES } from "@common/api/routes";
import { games, rooms } from "@server/api/routes";
import { CONFIG } from "@server/config";
import { initDb } from "@server/db/database";

export async function startServer() {
  await initDb();

  const app = express();
  app.use(express.json());

  // Routes:
  app.use(ROUTES.games.path, games);
  app.use(ROUTES.rooms.path, rooms);

  app.listen(CONFIG.port, () => {
    console.log(`Server running on port ${CONFIG.port} (${CONFIG.nodeEnv})`);
  });
}
