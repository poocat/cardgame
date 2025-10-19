import z from "zod";
import { Routes } from "./types";

export const gameIdSchema = z.string();
export const playerIdSchema = z.string();
export const timestampSchema = z.string();

export const ROUTES = {
  games: {
    path: "/games",
    methods: {
      getMany: {
        path: "/",
        schemas: {
          responseBody: z.strictObject({
            games: z.array(
              z.strictObject({
                gameId: gameIdSchema,
                updatedAt: timestampSchema,
              }),
            ),
          }),
        },
      },
      getOne: {
        path: "/:id",
        schemas: {
          requestParams: z.strictObject({ id: z.string() }),
          requestQuery: z.object({ playerId: z.string().optional() }),
          responseBody: z.strictObject({
            gameId: gameIdSchema,
            updatedAt: timestampSchema,
            data: z.record(z.string(), z.any()), // TODO!!!
          }),
        },
      },

      patch: {
        path: "/:id",
        schemas: {
          requestParams: z.strictObject({ id: z.string() }),
          requestBody: z.strictObject({
            decision: z.strictObject({
              playerId: playerIdSchema,
              name: z.string(),
              values: z.array(z.string()),
            }),
          }),
        },
      },
      post: {
        path: "/",
        schemas: {
          responseBody: z.strictObject({
            gameId: gameIdSchema,
          }),
        },
      },
    },
  },
} as const satisfies Routes;
