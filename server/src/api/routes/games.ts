import { Router, json as jsonHandler } from "express";
import { ROUTES } from "@common/api/routes";
import { allGames, allRooms, makeGameEtag, makeId } from "@server/api/data";
import { validated } from "@server/api/wrappers";
import { initGameData } from "@server/game/initGameData";
import { makeDecision } from "@server/game/stateMachine";
import { CONSTANTS } from "@server/game/rules/constants";

export const games = Router();
games.use(jsonHandler());

/******************************************************************************
 * ### POST games/
 *
 * Creates a new game from an existing room.
 *
 * Only the room's "host" can start a game. Since none of the room's "guests"
 * should be able to see the host's id, the host's id used as a way to
 * "authenticate" the request.
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
        return res
          .status(404)
          .json({ message: `room ${req.body.roomId} not found` });
      }
      const players = [room.data.host, ...room.data.guests]; // TODO!!! Randomize order.
      const { minNumPlayers } = CONSTANTS;
      if (players.length < minNumPlayers) {
        return res
          .status(400)
          .json({ message: `room does not have enough players` });
      }
      const now = new Date();
      const gameData = initGameData(players);
      const gameDocument: (typeof allGames)[number] = {
        _id: makeId(now),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        data: gameData,
      };
      allGames.push(gameDocument);
      room.gameId = gameDocument._id;
      room.updatedAt = now.toISOString();
      return res.status(200).json({ gameId: gameDocument._id });
    },
  }),
);

/******************************************************************************
 * ### GET games/
 *
 * Lists active games, and the last time each was updated.
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
 * Can poll this endpoint efficiently by setting "If-None-Match" header.
 *
 * A player's id can be passed as a query string, to indicate which player
 * is requesting the game state.
 *
 * TODO!!! Use the player id to redact certain parts of the game state that the
 * player should not see. Each player's id should be secret to each other
 * player.
 ******************************************************************************/
games.get(
  ROUTES.games.methods.getOne.path,
  validated({
    schemas: ROUTES.games.methods.getOne.schemas,
    handler: async (req, res) => {
      const game = allGames.find((g) => g._id === req.params.id);
      if (!game) {
        return res
          .status(404)
          .send({ message: `game ${req.params.id} not found` });
      }

      const etag = makeGameEtag(game, req.query.playerId);
      if (req.get("If-None-Match") === etag) {
        return res.status(304).end();
      }

      res.set("ETag", etag);
      res.status(200).send({
        gameId: game._id,
        updatedAt: new Date(game.updatedAt).toISOString(),
        data: game.data,
      });
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
      if (!game) {
        // 404-Not Found
        return res
          .status(404)
          .send({ message: `game ${req.params.id} not found` });
      }

      const nextGameData = makeDecision({
        gameData: game.data,
        decision: req.body.decision,
      });
      game.data = nextGameData;
      game.updatedAt = new Date().toISOString();
      // 204-No Content, indicates success, should trigger client to make
      // another GET to get the updated game state.
      res.status(204).end();
    },
  }),
);
