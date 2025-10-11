import { Request, Response, Router, json as jsonHandler } from "express";
import { makeDecision } from "@server/game/stateMachine";
import { createMockGameData } from "@server/mock";
import {
	GameId,
	GamesGetAllResponse,
	GamesGetOneQuery,
	GamesGetOneResponse,
	GamesPatchBody,
	gamesPatchBodySchema,
	GamesPostResponse,
} from "@server/api/games/schemas";
import { GameData } from "@common/types";

export const games = Router();
games.use(jsonHandler());

type ErrorResponse = { message: string };

// Database mockery
type GameDbDocument = {
	_id: string;
	createdAt: string;
	updatedAt: string;
	data: GameData;
};
const mockGamesDb: GameDbDocument[] = [];

/******************************************************************************
 * ### POST games/
 *
 * Creates a new game.
 ******************************************************************************/
games.post(
	"/",
	async (_: Request, res: Response<GamesPostResponse | ErrorResponse>) => {
		try {
			const now = new Date().toISOString();
			const gameDocument: GameDbDocument = {
				_id: now,
				createdAt: now,
				updatedAt: now,
				data: createMockGameData(),
			};
			mockGamesDb.push(gameDocument);
			res.status(200).send({ gameId: gameDocument._id });
		} catch (error) {
			res.status(400).send({ message: `${error}` });
		}
	},
);

/******************************************************************************
 * ### GET games/
 *
 * Lists active games, with most recently updated first.
 ******************************************************************************/
games.get(
	"/",
	async (_: Request, res: Response<GamesGetAllResponse | ErrorResponse>) => {
		try {
			const games = mockGamesDb.map((g) => ({
				gameId: g._id,
				updatedAt: new Date(g.updatedAt),
			}));
			res.status(200).send({ games });
		} catch (error) {
			res.status(500).send({ message: `${error}` });
		}
	},
);

/******************************************************************************
 * ### GET games/{id}?playerId={playerId}
 *
 * Used to get the full state of the game with the given id.
 *
 * Query strings can be used to indicate which player is requesting the game
 * state, which may be used to redact certain parts of the game state that the
 * player should not be able to see.
 ******************************************************************************/
games.get(
	"/:id",
	async (
		req: Request<{ id: GameId }, undefined, undefined, GamesGetOneQuery>,
		res: Response<GamesGetOneResponse | ErrorResponse>,
	) => {
		try {
			/**
			 * TODO!!!
			 * Use the player ID to get a "digest" of the game. The digest will:
			 * - transform sensitive values like other player IDs (so they cannot
			 *   play as another player)
			 * - redact values that the player shouldn't be able to see
			 */
			const game = mockGamesDb.find((g) => g._id === req.params.id);
			if (game) {
				res.set("Last-Updated-At", game.updatedAt);
				res.status(200).send({
					gameId: game._id,
					updatedAt: new Date(game.updatedAt),
					data: game.data,
				});
			} else {
				res.status(404).send({ message: `game ${req.params.id} not found` });
			}
		} catch (error) {
			res.status(500).send({ message: `${error}` });
		}
	},
);

/******************************************************************************
 * ### HEAD games/{id}
 *
 * Used by the client app to poll the server for updates to the game state.
 ******************************************************************************/
games.head("/:id", async (req: Request<{ id: GameId }>, res: Response) => {
	try {
		const game = mockGamesDb.find((g) => g._id === req.params.id);
		if (game) {
			res.set("Last-Updated-At", game.updatedAt).status(204).end();
		} else {
			res.status(404).send({ message: `game ${req.params.id} not found` });
		}
	} catch (error) {
		res.status(500).send({ message: `${error}` });
	}
});

/******************************************************************************
 * ### PATCH games/{id}
 *
 * The primary method by which the client updates the game state.
 *
 * Sends a decision for the current choice, and updates the game state
 * accordingly.
 ******************************************************************************/
games.patch(
	"/:id",
	async (
		req: Request<{ id: GameId }, undefined, GamesPatchBody>,
		res: Response<undefined | ErrorResponse>,
	) => {
		try {
			gamesPatchBodySchema.parse(req.body);
			const game = mockGamesDb.find((g) => g._id === req.params.id);
			if (game) {
				const nextGameData = makeDecision({
					gameData: game.data,
					decision: req.body.decision,
				});
				game.data = nextGameData;
				game.updatedAt = new Date().toISOString();
				// 204-No Content, indicates success, should trigger client to make
				// another GET to get the updated game state.
				res.status(204).end();
			} else {
				// 404-Not Found
				res.status(404).send({ message: `game ${req.params.id} not found` });
			}
		} catch (error) {
			res.status(500).send({ message: `${error}` });
			console.log(error);
		}
	},
);
