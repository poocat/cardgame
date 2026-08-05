import { cardDefDigestSchema } from "@common/api/digests";
import { errorHandler } from "@server/api/middleware";
import { cardsRouter } from "@server/api/routes/cards/routes";
import {
  extendCardRegistry,
  resetCardRegistry,
  useExampleCards,
} from "@server/game/cards/registry";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import z from "zod";
import { testCards } from "../../fixtures/cards";

const catalogSchema = z.strictObject({
  cards: z.array(cardDefDigestSchema),
});

/**
 * The catalog is snapshotted when the router is built, so each app sees
 * whatever is in the registry at the moment it is created.
 */
const makeApp = () => {
  const app = express();
  app.use(cardsRouter.path, cardsRouter.create({ cardImagesPath: null }));
  app.use(errorHandler);
  return app;
};

describe("GET /api/cards", () => {
  beforeAll(() => {
    useExampleCards();
  });

  afterAll(() => {
    resetCardRegistry();
  });

  it("returns a definition for every registered card", async () => {
    const res = await request(makeApp()).get("/api/cards");
    expect(res.status).toBe(200);

    const parsed = catalogSchema.safeParse(res.body);
    expect(parsed.error?.issues ?? []).toEqual([]);
    expect(parsed.data?.cards.length).toBeGreaterThan(0);
    expect(parsed.data?.cards.map((c) => c.name)).toContain("Example Producer");
  });

  it("serves no game state with the definitions", async () => {
    const res = await request(makeApp()).get("/api/cards");
    // `cardDefDigestSchema` is strict, so the parse above already rejects
    // stray keys. This asserts the absence of the specific things that would
    // be a leak: identity and location of a card in someone's game.
    expect(JSON.stringify(res.body)).not.toMatch(/"(id|lastMovedOn|chips)/);
  });

  it("revalidates with an ETag", async () => {
    const app = makeApp();
    const first = await request(app).get("/api/cards");
    const etag = first.headers.etag;
    expect(etag).toBeTruthy();
    expect(first.headers["cache-control"]).toBe("public, max-age=300");

    const second = await request(app)
      .get("/api/cards")
      .set("If-None-Match", etag);
    expect(second.status).toBe(304);
    expect(second.body).toEqual({});
    // A 304 has to repeat the headers that would have been sent with a 200,
    // so a shared cache can refresh what it has stored.
    expect(second.headers.etag).toBe(etag);
    expect(second.headers["cache-control"]).toBe("public, max-age=300");
  });

  it("matches a weakened ETag, as introduced by a compressing proxy", async () => {
    const app = makeApp();
    const first = await request(app).get("/api/cards");
    const res = await request(app)
      .get("/api/cards")
      .set("If-None-Match", `W/${first.headers.etag}`);
    expect(res.status).toBe(304);
  });

  it("serves a different ETag for a different set of cards", async () => {
    const withExamples = await request(makeApp()).get("/api/cards");

    resetCardRegistry();
    extendCardRegistry({ cards: Object.values(testCards) });
    const withTestCards = await request(makeApp()).get("/api/cards");

    expect(withTestCards.body.cards.length).toBeGreaterThan(0);
    expect(withTestCards.headers.etag).not.toBe(withExamples.headers.etag);

    // Leave the registry as the rest of the suite expects to find it.
    useExampleCards();
  });
});
