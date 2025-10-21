import { Router, json as jsonHandler } from "express";
import { ROUTES } from "@common/api/routes";
import { allGames, allRooms } from "@server/api/data";
import { validated } from "@server/api/wrappers";
import { initGameData } from "@server/game/initGameData";
import { makeDecision } from "@server/game/stateMachine";

export const games = Router();
games.use(jsonHandler());

/******************************************************************************
 * ### POST games/
 *
 * Creates a new game.
 ******************************************************************************/
games.post(
  ROUTES.games.methods.post.path,
  validated({
    schemas: ROUTES.games.methods.post.schemas,
    handler: async (req, res) => {
      const room = allRooms.find(
        (r) => r._id === req.body.roomId && r.data.host.id === req.body.hostId,
      );
      if (!room) {
        res.status(404).send({ message: `room ${req.body.roomId} not found` });
      } else {
        const players = [...room.data.guests];
        players.push(room.data.host);
        const now = new Date();
        const gameData = initGameData(players);
        const gameDocument: (typeof allGames)[number] = {
          _id: now.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          data: gameData,
        };
        allGames.push(gameDocument);
        room.gameId = gameDocument._id;
        res.status(200).json({ gameId: gameDocument._id });
      }
    },
  }),
);

/******************************************************************************
 * ### GET games/
 *
 * Lists active games, with most recently updated first.
 ******************************************************************************/
games.get(
  ROUTES.games.methods.getMany.path,
  validated({
    schemas: ROUTES.games.methods.getMany.schemas,
    handler: async (_, res) => {
      const games = allGames.map((g) => ({
        gameId: g._id,
        updatedAt: new Date(g.updatedAt).toISOString(),
      }));
      res.status(200).json({ games });
    },
  }),
);

/******************************************************************************
 * ### GET games/{id}?playerId={playerId}
 *
 * Used to get the full state of the game with the given id.
 *
 * Can poll this endpoint efficiently by setting "If-Modified-Since" header.
 *
 * Query strings can be used to indicate which player is requesting the game
 * state, which may be used to redact certain parts of the game state that the
 * player should not be able to see.
 ******************************************************************************/
games.get(
  ROUTES.games.methods.getOne.path,
  validated({
    schemas: ROUTES.games.methods.getOne.schemas,
    handler: async (req, res) => {
      /**
       * TODO!!!
       * Use the player ID to get a "digest" of the game. The digest will:
       * - transform sensitive values like other player IDs (so they cannot
       *   play as another player)
       * - redact values that the player shouldn't be able to see
       */
      // console.log(req.query.playerId);
      const game = allGames.find((g) => g._id === req.params.id);
      if (game) {
        const lastModified = new Date(game.updatedAt);
        res.set("Last-Modified", lastModified.toUTCString());
        const challenge = req.headers["if-modified-since"];
        if (challenge && new Date(challenge) >= lastModified) {
          // 304-Not Modified
          res.status(304).end();
        } else {
          res.status(200).send({
            gameId: game._id,
            updatedAt: new Date(game.updatedAt).toISOString(),
            data: game.data,
          });
        }
      } else {
        res.status(404).send({ message: `game ${req.params.id} not found` });
      }
    },
  }),
);

/******************************************************************************
 * ### PATCH games/{id}
 *
 * The primary method by which the client updates the game state.
 *
 * Sends a decision for the current choice, and updates the game state
 * accordingly.
 ******************************************************************************/
games.patch(
  ROUTES.games.methods.patch.path,
  validated({
    schemas: ROUTES.games.methods.patch.schemas,
    handler: async (req, res) => {
      const game = allGames.find((g) => g._id === req.params.id);
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
    },
  }),
);
