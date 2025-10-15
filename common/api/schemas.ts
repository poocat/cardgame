import { z } from "zod";

export const gameIdSchema = z.string();
export const playerIdSchema = z.string();
export const timestampSchema = z.string();

export const gamesGetManyResponseBodySchema = z.strictObject({
  games: z.array(
    z.strictObject({ gameId: gameIdSchema, updatedAt: timestampSchema }),
  ),
});

export const gamesGetOneRequestParamsSchema = z.strictObject({
  id: gameIdSchema,
});

export const gamesGetOneRequestQuerySchema = z.object({
  playerId: z.optional(playerIdSchema),
});

export const gamesGetOneResponseBodySchema = z.strictObject({
  gameId: gameIdSchema,
  updatedAt: timestampSchema,
  data: z.record(z.string(), z.any()), // TODO!!!
});

export const gamesPatchRequestBodySchema = z.strictObject({
  decision: z.strictObject({
    playerId: playerIdSchema,
    name: z.string(),
    values: z.array(z.string()),
  }),
});

export const gamesPostResponseBodySchema = z.strictObject({
  gameId: gameIdSchema,
});
