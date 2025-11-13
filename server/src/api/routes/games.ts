import { Router, json as jsonHandler } from "express";
import { ROUTES } from "@common/api/routes";
import { CONSTANTS } from "@common/game/constants";
import { STATUS } from "@server/api/status";
import { deanonymizeDecision, digestGameData } from "@server/api/transformers";
import { validated } from "@server/api/wrappers";
import {
  findGame,
  findGames,
  insertGame,
  updateGameData,
} from "@server/db/collections/games";
import { findRoom, updateRoomGameId } from "@server/db/collections/rooms";
import { makeDecision } from "@server/game/stateMachine";
import { initGameData } from "@server/game/initGameData";
import { GameData } from "@common/game/types";
import { makeEtag } from "@server/db/meta";

export const games = Router();
games.use(jsonHandler());

/******************************************************************************
 * ### POST games/
 *
 * Creates a new game from an existing room, and updates the room with the
 * created game id.
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
      const { room } = await findRoom(req.body.roomId);

      if (!room) {
        return res
          .status(STATUS.notFound)
          .json({ message: `room ${req.body.roomId} not found` });
      } else if (room.data.host.id !== req.body.hostId) {
        return res
          .status(STATUS.forbidden)
          .json({ message: `game can only be started by host` });
      }

      const players = [room.data.host, ...room.data.guests];

      const { minNumPlayers } = CONSTANTS;
      if (players.length < minNumPlayers) {
        return res
          .status(STATUS.badRequest)
          .json({ message: `room does not have enough players` });
      }

      const gameData = initGameData(players);
      const { gameId } = await insertGame(gameData);
      await updateRoomGameId(room.meta.id, gameId);

      return res.status(STATUS.ok).json({ gameId });
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
      const { games } = await findGames();

      const items = games.map((g) => ({
        gameId: g.meta.id,
        updatedAt: g.meta.updatedAt,
      }));

      res.status(STATUS.ok).json({ games: items });
    },
  }),
);

/******************************************************************************
 * ### GET games/{id}?playerId={playerId}
 *
 * Used to get the full digest of the game with the given id.
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
      const { game } = await findGame(req.params.id);
      if (!game) {
        return res
          .status(STATUS.notFound)
          .send({ message: `game ${req.params.id} not found` });
      }

      const etag = makeEtag(game.meta, req.query.playerId);
      if (req.get("If-None-Match") === etag) {
        return res.status(STATUS.notModified).end();
      }

      const digest = digestGameData({
        gameData: game.data,
        anonymizationSalt: game.meta.anonymizationSalt,
        playerId: req.query.playerId,
      });

      res.set("ETag", etag);
      res.status(STATUS.ok).send({
        gameId: game.meta.id,
        updatedAt: new Date(game.meta.updatedAt).toISOString(),
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
      const { game } = await findGame(req.params.id);
      if (!game) {
        // 404-Not Found
        return res
          .status(STATUS.notFound)
          .send({ message: `game ${req.params.id} not found` });
      }

      const decision = deanonymizeDecision({
        decision: req.body.decision,
        anonymizationSalt: game.meta.anonymizationSalt,
        playerIds: game.data.players.map((p) => p.id),
      });

      const nextGameData = makeDecision({
        gameData: game.data,
        decision,
      });
      await updateGameData(game.meta.id, nextGameData);

      res.status(STATUS.noContent).end();
    },
  }),
);
