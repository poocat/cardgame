import * as z from "zod";

export const gameIdSchema = z.string();
export type GameId = z.infer<typeof gameIdSchema>;

export const playerIdSchema = z.string();
export type PlayerId = z.infer<typeof gameIdSchema>;

export const timestampSchema = z.date();
export type Timestamp = z.infer<typeof timestampSchema>;

export const gamesGetAllResponseSchema = z.object({
	games: z.array(
		z.object({ gameId: gameIdSchema, updatedAt: timestampSchema }),
	),
});
export type GamesGetAllResponse = z.infer<typeof gamesGetAllResponseSchema>;

export const gamesGetOneQuerySchema = z.object({
	playerId: playerIdSchema,
});
export type GamesGetOneQuery = z.infer<typeof gamesGetOneQuerySchema>;

export const gamesGetOneResponseSchema = z.object({
	gameId: gameIdSchema,
	updatedAt: timestampSchema,
	data: z.record(z.string(), z.any()), // TODO!!! The API should always transform game data.
});
export type GamesGetOneResponse = z.infer<typeof gamesGetOneResponseSchema>;

export const gamesPatchBodySchema = z.object({
	decision: z.object({
		playerId: playerIdSchema,
		name: z.string(),
		values: z.array(z.string()),
	}),
});
export type GamesPatchBody = z.infer<typeof gamesPatchBodySchema>;

export const gamesPostResponseSchema = z.object({
	gameId: gameIdSchema,
});
export type GamesPostResponse = z.infer<typeof gamesPostResponseSchema>;
