import { errorHandler } from "@server/api/middleware";
import { localesRouter } from "@server/api/routes/locales/routes";
import { useDefaultLocales } from "@server/text/registry";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

describe("GET /messages", () => {
  useDefaultLocales();

  const app = express();
  app.use(localesRouter.path, localesRouter.create());
  app.use(errorHandler);

  it("returns default English locale", async () => {
    const res = await request(app).get(`/api/locales/en`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      bundle: expect.objectContaining({ title: "Cardgame" }),
    });
  });

  it("fails when locale isn't a valid code", async () => {
    const res = await request(app).get(`/api/locales/fakeLocale`);
    expect(res.status).toBe(400);
  });

  it("returns empty bundle for unimplemented locale", async () => {
    const res = await request(app).get(`/api/locales/cn`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ bundle: {} });
  });
});
