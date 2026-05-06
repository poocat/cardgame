import { randomUUID } from "node:crypto";
import { CONSTANTS } from "@common/game/constants";
import { errorHandler } from "@server/api/middleware";
import { roomsRouter } from "@server/api/routes";
import express from "express";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { testDb } from "../../helpers/testDb";

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

async function makeRoomsApp() {
  const db = await testDb();
  const app = express();
  app.use(
    roomsRouter.path,
    roomsRouter.create({ repositories: db.repositories, rateLimiters: [] }),
  );
  app.use(errorHandler);
  return { db, app };
}

////////////////////////////////////////////////////////////////////////////////
// Tests
////////////////////////////////////////////////////////////////////////////////

describe("POST /api/rooms/", async () => {
  const { db, app } = await makeRoomsApp();
  afterAll(async () => await db.close());

  it("creates a room and returns roomId + hostId", async () => {
    const res = await request(app)
      .post("/api/rooms/")
      .send({ hostName: "alice" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      roomId: expect.any(String),
      hostId: expect.any(String),
    });
  });
});

describe("GET /api/rooms/:id", async () => {
  const { db, app } = await makeRoomsApp();
  afterAll(async () => await db.close());

  const created = await request(app)
    .post("/api/rooms/")
    .send({ hostName: "alice" });
  const roomId: string = created.body.roomId;

  it("returns 404 for an unknown room", async () => {
    const res = await request(app).get(`/api/rooms/${randomUUID()}`);
    expect(res.status).toBe(404);
  });

  it("returns the room digest with an ETag", async () => {
    const res = await request(app).get(`/api/rooms/${roomId}`);
    expect(res.status).toBe(200);
    expect(res.body.roomId).toBe(roomId);
    expect(res.body.gameId).toBeNull();
    expect(res.body.digest.host.name).toBe("alice");
    expect(res.body.digest.guests).toEqual([]);
    expect(res.headers.etag).toBeDefined();
  });

  it("returns 304 when If-None-Match matches", async () => {
    const first = await request(app).get(`/api/rooms/${roomId}`);
    const etag = first.headers.etag;
    const second = await request(app)
      .get(`/api/rooms/${roomId}`)
      .set("If-None-Match", etag);
    expect(second.status).toBe(304);
  });
});

describe("POST /api/rooms/:id/guests", async () => {
  const { db, app } = await makeRoomsApp();
  afterAll(async () => await db.close());

  it("returns 404 for an unknown room", async () => {
    const res = await request(app)
      .post(`/api/rooms/${randomUUID()}/guests`)
      .send({ guestName: "bob" });
    expect(res.status).toBe(404);
  });

  it("adds a guest", async () => {
    const created = await request(app)
      .post("/api/rooms/")
      .send({ hostName: "alice" });
    const res = await request(app)
      .post(`/api/rooms/${created.body.roomId}/guests`)
      .send({ guestName: "bob" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ playerId: expect.any(String) });
  });

  it("returns 409 when the guest name duplicates an existing player", async () => {
    const created = await request(app)
      .post("/api/rooms/")
      .send({ hostName: "alice" });
    const res = await request(app)
      .post(`/api/rooms/${created.body.roomId}/guests`)
      .send({ guestName: "alice" });
    expect(res.status).toBe(409);
  });

  it("returns 409 when the room is full", async () => {
    const created = await request(app)
      .post("/api/rooms/")
      .send({ hostName: "host" });
    const roomId = created.body.roomId;

    for (let i = 0; i < CONSTANTS.maxNumPlayers - 1; i++) {
      const seed = await request(app)
        .post(`/api/rooms/${roomId}/guests`)
        .send({ guestName: `g${i}` });
      expect(seed.status).toBe(201);
    }

    const res = await request(app)
      .post(`/api/rooms/${roomId}/guests`)
      .send({ guestName: "extra" });
    expect(res.status).toBe(409);
  });
});

describe("GET /api/rooms?gameId=", async () => {
  const { db, app } = await makeRoomsApp();
  afterAll(async () => await db.close());

  it("returns 404 when no room is linked to that gameId", async () => {
    const res = await request(app).get(`/api/rooms/?gameId=${randomUUID()}`);
    expect(res.status).toBe(404);
  });

  it("returns the room when one is linked", async () => {
    const created = await request(app)
      .post("/api/rooms/")
      .send({ hostName: "alice" });
    const roomId: string = created.body.roomId;

    // Link a fake gameId directly via the repo — exercising the full
    // POST /api/games flow lives in games.test.ts.
    const room = await db.repositories.rooms.findOne({ id: roomId });
    if (!room) throw new Error("seed failed");
    const fakeGameId = randomUUID();
    await db.repositories.rooms.updateOne({
      id: roomId,
      version: room.meta.version,
      data: { ...room.data, gameId: fakeGameId },
    });

    const res = await request(app).get(`/api/rooms/?gameId=${fakeGameId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ roomId });
  });
});

describe("PATCH /api/rooms/:id", async () => {
  const { db, app } = await makeRoomsApp();
  afterAll(async () => await db.close());

  it("returns 404 for an unknown room", async () => {
    const res = await request(app)
      .patch(`/api/rooms/${randomUUID()}?playerId=${randomUUID()}`)
      .send({ gameId: null });
    expect(res.status).toBe(404);
  });

  it("returns 403 when patched by a non-host", async () => {
    const created = await request(app)
      .post("/api/rooms/")
      .send({ hostName: "alice" });
    const res = await request(app)
      .patch(`/api/rooms/${created.body.roomId}?playerId=${randomUUID()}`)
      .send({ gameId: null });
    expect(res.status).toBe(403);
  });

  it("clears gameId when patched by the host", async () => {
    const created = await request(app)
      .post("/api/rooms/")
      .send({ hostName: "alice" });
    const { roomId, hostId } = created.body;

    // Seed a non-null gameId so the patch has something to clear.
    const room = await db.repositories.rooms.findOne({ id: roomId });
    if (!room) throw new Error("seed failed");
    await db.repositories.rooms.updateOne({
      id: roomId,
      version: room.meta.version,
      data: { ...room.data, gameId: randomUUID() },
    });

    const res = await request(app)
      .patch(`/api/rooms/${roomId}?playerId=${hostId}`)
      .send({ gameId: null });
    expect(res.status).toBe(204);

    const after = await request(app).get(`/api/rooms/${roomId}`);
    expect(after.body.gameId).toBeNull();
  });
});
