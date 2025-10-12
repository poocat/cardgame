import * as z from "zod";

export const gameIdSchema = z.string();

export const playerIdSchema = z.string();

export const timestampSchema = z.date();

export const gamesGetAllResponseSchema = z.strictObject({
	games: z.array(
		z.strictObject({ gameId: gameIdSchema, updatedAt: timestampSchema }),
	),
});

export const gamesGetOneParamsSchema = z.strictObject({
	id: gameIdSchema,
});

export const gamesGetOneQuerySchema = z.object({
	playerId: z.optional(playerIdSchema),
});

export const gamesGetOneResponseSchema = z.strictObject({
	gameId: gameIdSchema,
	updatedAt: timestampSchema,
	data: z.record(z.string(), z.any()), // TODO!!!
});

export const gamesPatchBodySchema = z.strictObject({
	decision: z.strictObject({
		playerId: playerIdSchema,
		name: z.string(),
		values: z.array(z.string()),
	}),
});

export const gamesPostResponseSchema = z.strictObject({
	gameId: gameIdSchema,
});
