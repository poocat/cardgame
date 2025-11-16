import { Router, json as jsonHandler } from "express";
import { ROUTES } from "@common/api/routes";
import { CONSTANTS } from "@common/game/constants";
import { STATUS } from "@server/api/status";
import { digestRoomData } from "@server/api/transformers";
import { validated } from "@server/api/wrappers";
import { makeId, makeMetaHash } from "@server/db/meta";
import { getRepositories } from "@server/db/database";

export const rooms = Router();
rooms.use(jsonHandler());

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
        return res
          .status(STATUS.internalServerError)
          .json({ message: `could not insert room` });
      }

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
        return res
          .status(STATUS.notFound)
          .json({ message: `room ${req.params.id} not found` });
      }

      const etag = makeMetaHash(projected.meta, req.query.playerId);
      if (req.get("If-None-Match") === etag) {
        return res.status(STATUS.notModified).end();
      }

      const room = await roomRepo.findOne({ id: req.params.id });
      if (!room) {
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
        return res
          .status(STATUS.notFound)
          .json({ message: `room ${req.params.id} not found` });
      }

      // Validate the request body.
      const { guestName } = req.body;
      const { maxNumPlayers } = CONSTANTS;
      const currentPlayers = [room.data.host, ...room.data.guests];
      if (currentPlayers.length >= maxNumPlayers) {
        return res.status(STATUS.conflict).json({
          message: `room already has ${maxNumPlayers} players`,
        });
      }

      const currentPlayerNames = currentPlayers.map((p) => p.name.trim());
      if (currentPlayerNames.includes(guestName.trim())) {
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
        return res
          .status(STATUS.conflict)
          .json({ message: `room already updated, please retry` });
      }

      return res.status(STATUS.ok).json({ playerId: guestId });
    },
  }),
);
