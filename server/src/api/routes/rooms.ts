import { Router, json as jsonHandler } from "express";
import { ROUTES } from "@common/api/routes";
import { CONSTANTS } from "@common/game/constants";
import { STATUS } from "@server/api/status";
import { digestRoomData } from "@server/api/transformers";
import { validated } from "@server/api/wrappers";
import {
  findRoom,
  insertRoomWithHost,
  updateRoomAddGuest,
} from "@server/db/collections/rooms";
import { makeEtag } from "@server/db/meta";

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
      const { roomId, hostId } = await insertRoomWithHost(req.body.hostName);
      res.status(STATUS.ok).json({ roomId, hostId });
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
      const { room } = await findRoom(req.params.id);
      if (!room) {
        return res
          .status(STATUS.notFound)
          .json({ message: `room ${req.params.id} not found` });
      }

      const etag = makeEtag(room.meta, req.query.playerId);
      if (req.get("If-None-Match") === etag) {
        return res.status(STATUS.notModified).end();
      }

      const digest = digestRoomData({
        roomData: room.data,
        anonymizationSalt: room.meta.anonymizationSalt,
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
      const { room } = await findRoom(req.params.id);
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

      const { guestId } = await updateRoomAddGuest(room.meta.id, guestName);
      return res.status(STATUS.ok).json({ playerId: guestId });
    },
  }),
);
