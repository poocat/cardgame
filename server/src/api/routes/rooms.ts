import { Router, json as jsonHandler } from "express";
import { ROUTES } from "@common/api/routes";
import { CONSTANTS } from "@common/game/constants";
import { allRooms, makeDocumentId, makeRoomEtag } from "@server/api/data";
import { STATUS } from "@server/api/status";
import { validated } from "@server/api/wrappers";

export const rooms = Router();
rooms.use(jsonHandler());

function makePlayerId(name: string, date: Date): string {
  let id = `${name.trim().toLowerCase()}-${date.getTime().toString()}`;
  id = id.replace(/[^a-zA-Z0-9]+/g, "-");
  return id;
}

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
      const now = new Date();
      const hostId = makePlayerId(req.body.hostName, now);
      const roomDocument: (typeof allRooms)[number] = {
        _id: makeDocumentId(now),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        gameId: null,
        data: {
          host: {
            id: hostId,
            name: req.body.hostName,
          },
          guests: [],
        },
      };
      allRooms.push(roomDocument);
      res.status(STATUS.ok).json({ roomId: roomDocument._id, hostId: hostId });
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
 *
 * TODO!!! Use the player id to redact certain parts of the room that the
 * player should not see. Each player's id should be secret to each other
 * player.
 ******************************************************************************/
rooms.get(
  ROUTES.rooms.methods.getOne.path,
  validated({
    schemas: ROUTES.rooms.methods.getOne.schemas,
    handler: async (req, res) => {
      const room = allRooms.find((r) => r._id === req.params.id);
      if (!room) {
        return res
          .status(STATUS.notFound)
          .json({ message: `room ${req.params.id} not found` });
      }
      const etag = makeRoomEtag(room, req.query.playerId);
      if (req.get("If-None-Match") === etag) {
        return res.status(STATUS.notModified).end();
      }
      res.set("ETag", etag);
      /**
       * TODO!!! Anonymize other player IDs.
       */
      return res.status(STATUS.ok).json({
        roomId: room._id,
        gameId: room.gameId,
        host: room.data.host,
        guests: room.data.guests,
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
      const room = allRooms.find((r) => r._id === req.params.id);
      if (!room) {
        // 404-Not Found
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

      const now = new Date();
      const guest = {
        id: makePlayerId(guestName, now),
        name: guestName,
      };
      room.data.guests.push(guest);
      room.updatedAt = now.toISOString();
      return res.status(STATUS.ok).json({ playerId: guest.id });
    },
  }),
);
