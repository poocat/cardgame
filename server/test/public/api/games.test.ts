import { errorHandler } from "@server/api/middleware";
import { gamesRouter } from "@server/api/routes";
import express from "express";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { testDb } from "../../helpers/testDb";

describe("games endpoint", async () => {
  const db = await testDb();
  afterAll(async () => await db.close());

  const app = express();
  app.use(
    gamesRouter.path,
    gamesRouter.create({ repositories: db.repositories, rateLimiters: [] }),
  );
  app.use(errorHandler);

  it("gets no games from fresh database", async () => {
    const res = await request(app).get("/api/games/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ games: [] });
  });
});
