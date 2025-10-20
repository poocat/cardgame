import express from "express";
import { ROUTES } from "@common/api/routes";
import { games } from "@server/api/routes/games";
import { rooms } from "@server/api/routes/rooms";

export function createServer() {
  const app = express();
  app.use(express.json());

  // Routes:
  app.use(ROUTES.games.path, games);
  app.use(ROUTES.rooms.path, rooms);

  return app;
}
