import { ROUTES } from "@common/api/routes";
import { CONSTANTS } from "@common/game/constants";
import { STATUS } from "@server/api/status";
import { deanonymizeDecision, digestGameData } from "@server/api/transformers";
import { validated } from "@server/api/wrappers";
import { getRepositories } from "@server/db/database";
import { makeMetaHash } from "@server/db/meta";
import { initGameData } from "@server/game/initGameData";
import { makeDecision } from "@server/game/stateMachine";
import { logger } from "@server/logger";
import { json as jsonHandler, Router } from "express";

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
      const { rooms: roomRepo, games: gameRepo } = getRepositories();
      const room = await roomRepo.findOne({ id: req.body.roomId });

      if (!room) {
        logger.warn({ roomId: req.body.roomId }, "room not found");
        return res
          .status(STATUS.notFound)
          .json({ message: `room ${req.body.roomId} not found` });
      } else if (room.data.host.id !== req.body.hostId) {
        logger.warn(
          { roomId: req.body.roomId, attemptedBy: req.body.hostId },
          "unauthorized game start",
        );
        return res
          .status(STATUS.forbidden)
          .json({ message: `game can only be started by host` });
      }

      const players = [room.data.host, ...room.data.guests];

      const { minNumPlayers } = CONSTANTS;
      if (players.length < minNumPlayers) {
        logger.warn(
          {
            roomId: req.body.roomId,
            playerCount: players.length,
            required: minNumPlayers,
          },
          "insufficient players",
        );
        return res
          .status(STATUS.badRequest)
          .json({ message: `room does not have enough players` });
      }

      const gameData = initGameData(players);
      const game = await gameRepo.insertOne({ data: gameData });

      if (!game) {
        logger.error({ roomId: req.body.roomId }, "game creation failed");
        return res
          .status(STATUS.internalServerError)
          .json({ message: `failed to insert game` });
      }

      const roomData = { ...room.data, gameId: game.meta.id };
      await roomRepo.updateOne({ id: room.meta.id, data: roomData });

      logger.info(
        {
          gameId: game.meta.id,
          roomId: req.body.roomId,
          playerCount: players.length,
        },
        "game created",
      );
      return res.status(STATUS.ok).json({ gameId: game.meta.id });
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
      const { games: gameRepo } = getRepositories();

      const games = await gameRepo.findMany({ metaOnly: true });

      logger.debug({ count: games.length }, "listing games");

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
 * is requesting the game data.
 ******************************************************************************/
games.get(
  ROUTES.games.methods.getOne.path,
  validated({
    schemas: ROUTES.games.methods.getOne.schemas,
    handler: async (req, res) => {
      const { games: gameRepo } = getRepositories();

      const projected = await gameRepo.findOne({
        id: req.params.id,
        metaOnly: true,
      });
      if (!projected) {
        logger.warn({ gameId: req.params.id }, "game not found");
        return res
          .status(STATUS.notFound)
          .send({ message: `game ${req.params.id} not found` });
      }

      const etag = makeMetaHash(projected.meta, req.query.playerId);
      if (req.get("If-None-Match") === etag) {
        logger.debug(
          { gameId: req.params.id, playerId: req.query.playerId },
          "game not modified",
        );
        return res.status(STATUS.notModified).end();
      }

      const game = await gameRepo.findOne({ id: req.params.id });
      if (!game) {
        logger.warn({ gameId: req.params.id }, "game not found");
        return res
          .status(STATUS.notFound)
          .json({ message: `game ${req.params.id} not found` });
      }

      const digest = digestGameData({
        gameData: game.data,
        anonymizationSalt: game.meta.salt,
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
 * The primary method by which the client updates the game data.
 *
 * Sends a decision for the current choice, and updates the game data
 * accordingly.
 ******************************************************************************/
games.patch(
  ROUTES.games.methods.patch.path,
  validated({
    schemas: ROUTES.games.methods.patch.schemas,
    handler: async (req, res) => {
      const { games: gameRepo } = getRepositories();

      const game = await gameRepo.findOne({ id: req.params.id });
      if (!game) {
        logger.warn({ gameId: req.params.id }, "game not found");
        return res
          .status(STATUS.notFound)
          .send({ message: `game ${req.params.id} not found` });
      }

      const decision = deanonymizeDecision({
        decision: req.body.decision,
        anonymizationSalt: game.meta.salt,
        playerIds: game.data.players.map((p) => p.id),
      });

      logger.info(
        {
          gameId: req.params.id,
          playerId: decision.playerId,
          decisionName: decision.name,
          activityType: game.data.activity.type,
        },
        "decision received",
      );

      const nextGameData = makeDecision({
        gameData: game.data,
        decision,
      });

      const result = await gameRepo.updateOne({
        id: game.meta.id,
        data: nextGameData,
      });
      if (result.matchedCount === 0) {
        logger.error({ gameId: req.params.id }, "game update failed");
        return res
          .status(STATUS.internalServerError)
          .json({ message: `could not update game` });
      }

      logger.info(
        {
          gameId: req.params.id,
          playerId: decision.playerId,
          previousActivity: game.data.activity.type,
          newActivity: nextGameData.activity.type,
        },
        "decision applied",
      );

      res.status(STATUS.noContent).end();
    },
  }),
);
