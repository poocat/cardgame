import { ROUTES } from "@common/api/routes";
import { CONSTANTS } from "@common/game/constants";
import { STATUS } from "@server/api/status";
import { validated } from "@server/api/wrappers";
import { getRepositories } from "@server/db/database";
import { makeId, makeMetaHash } from "@server/db/meta";
import { logger } from "@server/logger";
import { json as jsonHandler, Router } from "express";
import { burstLimiter, sustainedLimiter } from "../../middleware";
import { digestRoomData } from "./digest";

export const rooms = Router();
rooms.use(jsonHandler());
rooms.use(burstLimiter({ windowMs: 10 * 1000, max: 30 }));
rooms.use(
  sustainedLimiter({
    windowMs: 60 * 1000,
    max: 60 * 2 * CONSTANTS.maxNumPlayers,
  }),
);

/******************************************************************************
 * ### POST rooms/
 *
 * Creates a new room with a designated host.
 ******************************************************************************/
rooms.post(
  ROUTES.rooms.methods.post.path,
  validated({
    schemas: ROUTES.rooms.methods.post.schemas,
    handler: async (req, res) => {
      const { rooms: roomRepo } = getRepositories();

      const hostId = makeId();
      const room = await roomRepo.insertOne({
        data: {
          gameId: null,
          host: {
            id: hostId,
            name: req.body.hostName,
          },
          guests: [],
        },
      });

      if (!room) {
        logger.error({ hostName: req.body.hostName }, "room creation failed");
        return res
          .status(STATUS.internalServerError)
          .json({ message: `could not insert room` });
      }

      logger.info({ roomId: room.meta.id, hostId }, "room created");
      res.status(STATUS.ok).json({ roomId: room.meta.id, hostId });
    },
  }),
);

/******************************************************************************
 * ### GET rooms/{id}?playerId={playerId}
 *
 * Used to get the full state of the room with the given id.
 *
 * A player's id can be passed as a query string, to indicate which player
 * is requesting the room state.
 ******************************************************************************/
rooms.get(
  ROUTES.rooms.methods.getOne.path,
  validated({
    schemas: ROUTES.rooms.methods.getOne.schemas,
    handler: async (req, res) => {
      const { rooms: roomRepo } = getRepositories();

      const projected = await roomRepo.findOne({
        id: req.params.id,
        metaOnly: true,
      });
      if (!projected) {
        logger.warn({ roomId: req.params.id }, "room not found");
        return res
          .status(STATUS.notFound)
          .json({ message: `room ${req.params.id} not found` });
      }

      const etag = makeMetaHash(projected.meta, req.query.playerId);
      if (req.get("If-None-Match") === etag) {
        logger.debug(
          { roomId: req.params.id, playerId: req.query.playerId },
          "room not modified",
        );
        return res.status(STATUS.notModified).end();
      }

      const room = await roomRepo.findOne({ id: req.params.id });
      if (!room) {
        logger.warn({ roomId: req.params.id }, "room not found");
        return res
          .status(STATUS.notFound)
          .json({ message: `room ${req.params.id} not found` });
      }

      const digest = digestRoomData({
        roomData: room.data,
        anonymizationSalt: room.meta.salt,
        playerId: req.query.playerId,
      });

      res.set("ETag", etag);
      return res.status(STATUS.ok).json({
        roomId: room.meta.id,
        gameId: room.data.gameId,
        digest,
      });
    },
  }),
);

/******************************************************************************
 * ### POST rooms/{id}/guests
 *
 * The method by which the client adds players to a room.
 *
 * Cannot add players past the maximum, and cannot add a player with the same
 * name as an existing player in the room.
 ******************************************************************************/
rooms.post(
  ROUTES.rooms.methods.postGuest.path,
  validated({
    schemas: ROUTES.rooms.methods.postGuest.schemas,
    handler: async (req, res) => {
      const { rooms: roomRepo } = getRepositories();

      const room = await roomRepo.findOne({ id: req.params.id });
      if (!room) {
        logger.warn({ roomId: req.params.id }, "room not found");
        return res
          .status(STATUS.notFound)
          .json({ message: `room ${req.params.id} not found` });
      }

      // Validate the request body.
      const { guestName } = req.body;
      const { maxNumPlayers } = CONSTANTS;
      const currentPlayers = [room.data.host, ...room.data.guests];
      if (currentPlayers.length >= maxNumPlayers) {
        logger.warn(
          { roomId: req.params.id, reason: "max players", guestName },
          "guest add conflict",
        );
        return res.status(STATUS.conflict).json({
          message: `room already has ${maxNumPlayers} players`,
        });
      }

      const currentPlayerNames = currentPlayers.map((p) => p.name.trim());
      if (currentPlayerNames.includes(guestName.trim())) {
        logger.warn(
          { roomId: req.params.id, reason: "duplicate name", guestName },
          "guest add conflict",
        );
        return res.status(STATUS.conflict).json({
          message: `room already has player '${guestName}'`,
        });
      }

      const guestId = makeId();
      const roomData = {
        ...room.data,
        guests: [
          ...room.data.guests,
          { id: guestId, name: req.body.guestName },
        ],
      };
      const result = await roomRepo.updateOne({
        id: req.params.id,
        version: room.meta.version,
        data: roomData,
      });
      if (result.matchedCount === 0) {
        logger.warn({ roomId: req.params.id, guestName }, "guest add conflict");
        return res
          .status(STATUS.conflict)
          .json({ message: `room already updated, please retry` });
      }

      logger.info({ roomId: req.params.id, guestId, guestName }, "guest added");
      return res.status(STATUS.ok).json({ playerId: guestId });
    },
  }),
);

/******************************************************************************
 * ### GET rooms?gameId={gameId}
 *
 * Used to get a room that is assigned the given game id.
 ******************************************************************************/
rooms.get(
  ROUTES.rooms.methods.getByGame.path,
  validated({
    schemas: ROUTES.rooms.methods.getByGame.schemas,
    handler: async (req, res) => {
      const { rooms: roomRepo } = getRepositories();
      const room = await roomRepo.findOneByGameId({ gameId: req.query.gameId });

      if (!room) {
        logger.warn({ gameId: req.query.gameId }, "room not found for game id");
        return res
          .status(STATUS.notFound)
          .json({ message: `room not found for game ${req.query.gameId}` });
      }

      res.status(STATUS.ok).json({ roomId: room.meta.id });
    },
  }),
);

/******************************************************************************
 * ### DELETE rooms/{id}/game?playerId={playerId}
 *
 * Use to implement a "rematch" feature.
 *
 * Nulls the game associated with a room, so that players can return to the
 * room without being redirected to a game, then start a new game.
 *
 * Can only be done successfully by the host player.
 ******************************************************************************/
rooms.delete(
  ROUTES.rooms.methods.deleteGame.path,
  validated({
    schemas: ROUTES.rooms.methods.deleteGame.schemas,
    handler: async (req, res) => {
      const { rooms: roomRepo } = getRepositories();

      roomRepo.findMany({});

      const room = await roomRepo.findOne({ id: req.params.id });
      if (!room) {
        logger.warn({ roomId: req.params.id }, "room not found");
        return res
          .status(STATUS.notFound)
          .json({ message: `room ${req.params.id} not found` });
      }
      if (req.query.playerId !== room.data.host.id) {
        logger.warn({ roomId: req.params.id }, "only host can delete game");
        return res
          .status(STATUS.forbidden)
          .json({ message: `room can only be reset by host` });
      }

      const result = await roomRepo.updateOne({
        id: req.params.id,
        version: room.meta.version,
        data: { ...room.data, gameId: null },
      });

      if (result.matchedCount === 0) {
        return res
          .status(STATUS.conflict)
          .json({ message: `room already updated, please retry` });
      }

      logger.info({ roomId: req.params.id }, "room game reset");
      return res.status(STATUS.noContent).end();
    },
  }),
);
