import { Router, json as jsonHandler } from "express";
import { ROUTES } from "@common/api/routes";
import { CONSTANTS } from "@common/game/constants";
import {
  allGames,
  allRooms,
  initGameData,
  makeGameEtag,
  makeId,
  makeSalt,
} from "@server/api/data";
import { deanonymizeDecision, digestGameData } from "@server/api/transformers";
import { STATUS } from "@server/api/status";
import { validated } from "@server/api/wrappers";
import { makeDecision } from "@server/game/stateMachine";

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
          .status(STATUS.notFound)
          .json({ message: `room ${req.body.roomId} not found` });
      }
      const players = [room.data.host, ...room.data.guests]; // TODO!!! Randomize order.
      const { minNumPlayers } = CONSTANTS;
      if (players.length < minNumPlayers) {
        return res
          .status(STATUS.badRequest)
          .json({ message: `room does not have enough players` });
      }
      const now = new Date();
      const gameData = initGameData(players);
      const gameDocument: (typeof allGames)[number] = {
        _id: makeId(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        anonymizationSalt: makeSalt(),
        data: gameData,
      };
      allGames.push(gameDocument);
      room.gameId = gameDocument._id;
      room.updatedAt = now.toISOString();
      return res.status(STATUS.ok).json({ gameId: gameDocument._id });
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
      res.status(STATUS.ok).json({ games });
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
 ******************************************************************************/
games.get(
  ROUTES.games.methods.getOne.path,
  validated({
    schemas: ROUTES.games.methods.getOne.schemas,
    handler: async (req, res) => {
      const game = allGames.find((g) => g._id === req.params.id);
      if (!game) {
        return res
          .status(STATUS.notFound)
          .send({ message: `game ${req.params.id} not found` });
      }

      const etag = makeGameEtag(game, req.query.playerId);
      if (req.get("If-None-Match") === etag) {
        return res.status(STATUS.notModified).end();
      }

      const digest = digestGameData({
        gameData: game.data,
        anonymizationSalt: game.anonymizationSalt,
        playerId: req.query.playerId,
      });

      res.set("ETag", etag);
      res.status(STATUS.ok).send({
        gameId: game._id,
        updatedAt: new Date(game.updatedAt).toISOString(),
        digest,
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
          .status(STATUS.notFound)
          .send({ message: `game ${req.params.id} not found` });
      }

      const playerIds = game.data.players.map((p) => p.id);
      const decision = deanonymizeDecision({
        decision: req.body.decision,
        anonymizationSalt: game.anonymizationSalt,
        playerIds,
      });

      const nextGameData = makeDecision({
        gameData: game.data,
        decision,
      });
      game.data = nextGameData;
      game.updatedAt = new Date().toISOString();
      res.status(STATUS.noContent).end();
    },
  }),
);
