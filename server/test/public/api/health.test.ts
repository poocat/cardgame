import { errorHandler } from "@server/api/middleware";
import { healthRouter } from "@server/api/routes";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

describe("GET /health", () => {
  const app = express();
  app.use(healthRouter.path, healthRouter.create());
  app.use(errorHandler);

  it("returns 200 with an empty body", async () => {
    const res = await request(app).get("/health/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });
});
