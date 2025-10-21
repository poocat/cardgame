import z from "zod";
import { Routes } from "./types";

export const gameIdSchema = z.string();
export const playerIdSchema = z.string();
export const playerNameSchema = z.string().min(1);
export const roomIdSchema = z.string();
export const timestampSchema = z.iso.datetime();

export const ROUTES = {
  games: {
    path: "/api/games",
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
          requestBody: z.strictObject({
            roomId: roomIdSchema,
            hostId: playerIdSchema,
          }),
          responseBody: z.strictObject({
            gameId: gameIdSchema,
          }),
        },
      },
    },
  },
  rooms: {
    path: "/api/rooms",
    methods: {
      getOne: {
        path: "/:id",
        schemas: {
          requestParams: z.strictObject({ id: roomIdSchema }),
          responseBody: z.strictObject({
            roomId: roomIdSchema,
            gameId: z.nullable(gameIdSchema),
            host: z.strictObject({
              id: playerIdSchema,
              name: playerNameSchema,
            }),
            guests: z.array(
              z.strictObject({
                id: playerIdSchema,
                name: playerNameSchema,
              }),
            ),
          }),
        },
      },
      post: {
        path: "/",
        schemas: {
          requestBody: z.strictObject({
            hostName: playerNameSchema,
          }),
          responseBody: z.strictObject({
            roomId: roomIdSchema,
            hostId: playerIdSchema,
          }),
        },
      },
      postGuest: {
        path: "/:id/guests",
        schemas: {
          requestParams: z.strictObject({ id: roomIdSchema }),
          requestBody: z.strictObject({
            guestName: playerNameSchema,
          }),
          responseBody: z.strictObject({
            playerId: playerIdSchema,
          }),
        },
      },
    },
  },
} as const satisfies Routes;
