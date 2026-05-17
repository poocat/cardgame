import { randomUUID } from "node:crypto";
import { CONSTANTS } from "@common/game/constants";
import { errorHandler } from "@server/api/middleware";
import { gamesRouter, roomsRouter } from "@server/api/routes";
import express from "express";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { testDb } from "../../helpers/testDb";

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

async function makeGamesApp() {
  const db = await testDb();
  const app = express();
  app.use(
    roomsRouter.path,
    roomsRouter.create({ repositories: db.repositories, rateLimiters: [] }),
  );
  app.use(
    gamesRouter.path,
    gamesRouter.create({ repositories: db.repositories, rateLimiters: [] }),
  );
  app.use(errorHandler);
  return { db, app };
}

async function seedRoom(app: express.Express, hostName = "alice") {
  const res = await request(app).post("/api/rooms/").send({ hostName });
  return { roomId: res.body.roomId, hostId: res.body.hostId };
}

async function seedRoomWithMinPlayers(app: express.Express) {
  const seed = await seedRoom(app);
  for (let i = 0; i < CONSTANTS.minNumPlayers - 1; i++) {
    await request(app)
      .post(`/api/rooms/${seed.roomId}/guests`)
      .send({ guestName: `g${i}` });
  }
  return seed;
}

////////////////////////////////////////////////////////////////////////////////
// Tests
////////////////////////////////////////////////////////////////////////////////

describe("GET /api/games/", async () => {
  const { db, app } = await makeGamesApp();
  afterAll(async () => await db.close());

  it("returns an empty list initially", async () => {
    const res = await request(app).get("/api/games/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ games: [] });
  });
});

describe("POST /api/games/", async () => {
  const { db, app } = await makeGamesApp();
  afterAll(async () => await db.close());

  it("returns 404 when the room does not exist", async () => {
    const res = await request(app)
      .post("/api/games/")
      .send({ roomId: randomUUID(), hostId: randomUUID() });
    expect(res.status).toBe(404);
  });

  it("returns 403 when called by a non-host", async () => {
    const { roomId } = await seedRoom(app);
    const res = await request(app)
      .post("/api/games/")
      .send({ roomId, hostId: randomUUID() });
    expect(res.status).toBe(403);
  });

  it("returns 400 when the room has fewer than minNumPlayers", async () => {
    const { roomId, hostId } = await seedRoom(app);
    const res = await request(app).post("/api/games/").send({ roomId, hostId });
    expect(res.status).toBe(400);
  });

  it("creates a game and links it to the room", async () => {
    const { roomId, hostId } = await seedRoomWithMinPlayers(app);
    const res = await request(app).post("/api/games/").send({ roomId, hostId });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ gameId: expect.any(String) });

    const room = await request(app).get(`/api/rooms/${roomId}`);
    expect(room.body.gameId).toBe(res.body.gameId);
  });
});

describe("GET /api/games/:id", async () => {
  const { db, app } = await makeGamesApp();
  afterAll(async () => await db.close());

  it("returns 404 for an unknown game", async () => {
    const res = await request(app).get(`/api/games/${randomUUID()}`);
    expect(res.status).toBe(404);
  });

  it("returns 304 when the client echoes back the exact ETag", async () => {
    const { roomId, hostId } = await seedRoomWithMinPlayers(app);
    const { body } = await request(app)
      .post("/api/games/")
      .send({ roomId, hostId });

    const first = await request(app).get(`/api/games/${body.gameId}`);
    expect(first.status).toBe(200);
    const etag = first.headers.etag;
    expect(etag).toBeTruthy();

    const second = await request(app)
      .get(`/api/games/${body.gameId}`)
      .set("If-None-Match", etag);
    expect(second.status).toBe(304);
  });

  it("returns 304 when a proxy has weakened the ETag (W/ prefix)", async () => {
    const { roomId, hostId } = await seedRoomWithMinPlayers(app);
    const { body } = await request(app)
      .post("/api/games/")
      .send({ roomId, hostId });

    const first = await request(app).get(`/api/games/${body.gameId}`);
    expect(first.status).toBe(200);

    // Emulates a compressing proxy/CDN downgrading the strong validator.
    const second = await request(app)
      .get(`/api/games/${body.gameId}`)
      .set("If-None-Match", `W/${first.headers.etag}`);
    expect(second.status).toBe(304);
  });
});

describe("PATCH /api/games/:id", async () => {
  const { db, app } = await makeGamesApp();
  afterAll(async () => await db.close());

  it("returns 404 for an unknown game", async () => {
    const res = await request(app)
      .patch(`/api/games/${randomUUID()}`)
      .send({
        decision: { playerId: randomUUID(), name: "any", values: [] },
      });
    expect(res.status).toBe(404);
  });
});
