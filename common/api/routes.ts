import { gameDigestSchema, roomDigestSchema } from "@common/api/digests";
import type { Routes } from "@common/api/types";
import z from "zod";

export const gameIdSchema = z.uuid();
export const playerIdSchema = z.uuid();
export const playerNameSchema = z.string().min(1).max(20);
export const roomIdSchema = z.uuid();
export const timestampSchema = z.iso.datetime();

export const ROUTES = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Games
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
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
          requestParams: z.strictObject({ id: gameIdSchema }),
          requestQuery: z.object({ playerId: playerIdSchema.optional() }),
          responseBody: z.strictObject({
            gameId: gameIdSchema,
            updatedAt: timestampSchema,
            digest: gameDigestSchema,
          }),
        },
      },
      patch: {
        path: "/:id",
        schemas: {
          requestParams: z.strictObject({ id: gameIdSchema }),
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
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Rooms
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  rooms: {
    path: "/api/rooms",
    methods: {
      getOne: {
        path: "/:id",
        schemas: {
          requestParams: z.strictObject({ id: roomIdSchema }),
          requestQuery: z.object({ playerId: playerIdSchema.optional() }),
          responseBody: z.strictObject({
            roomId: roomIdSchema,
            gameId: z.nullable(gameIdSchema),
            digest: roomDigestSchema,
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
