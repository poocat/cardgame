import { Router, json as jsonHandler } from "express";
import { allRooms, makeId } from "@server/api/data";
import { ROUTES } from "@common/api/routes";
import { validated } from "@server/api/wrappers";
import { CONSTANTS } from "@server/game/rules/constants";

export const rooms = Router();
rooms.use(jsonHandler());

function makePlayerId(name: string, date: Date): string {
  return `${name.toLowerCase()}-${date.getTime().toString()}`;
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
        _id: makeId(now),
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
      res.status(200).json({ roomId: roomDocument._id, hostId: hostId });
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
          .status(404)
          .json({ message: `game ${req.params.id} not found` });
      }

      const lastModified = new Date(room.updatedAt);
      res.set("Last-Modified", lastModified.toUTCString());
      const challenge = req.headers["if-modified-since"];
      if (challenge && new Date(challenge) >= lastModified) {
        // 304-Not Modified
        return res.status(304).end();
      }

      /**
       * TODO!!! Anonymize other player IDs.
       */
      return res.status(200).json({
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
          .status(404)
          .json({ message: `room ${req.params.id} not found` });
      }

      // Validate the request body.
      const { guestName } = req.body;
      const { maxNumPlayers } = CONSTANTS;
      const currentPlayers = [room.data.host, ...room.data.guests];
      if (currentPlayers.length >= maxNumPlayers) {
        // 409-Conflict
        return res.status(409).json({
          message: `room already has ${maxNumPlayers} players`,
        });
      }

      const currentPlayerNames = currentPlayers.map((p) => p.name.trim());
      if (currentPlayerNames.includes(guestName.trim())) {
        // 409-Conflict
        return res.status(409).json({
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
      return res.status(200).json({ playerId: guest.id });
    },
  }),
);
