import { Router, json as jsonHandler } from "express";
import { ROUTES } from "@common/api/routes";
import { validated } from "@server/api/handlers";
import { allRooms } from "../data";

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
      const now = new Date().toISOString();
      const hostId = `${req.body.hostName}-${now}`;
      const roomDocument: (typeof allRooms)[number] = {
        _id: now,
        createdAt: now,
        updatedAt: now,
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
 ******************************************************************************/
rooms.get(
  ROUTES.rooms.methods.getOne.path,
  validated({
    schemas: ROUTES.rooms.methods.getOne.schemas,
    handler: async (req, res) => {
      const room = allRooms.find((r) => r._id === req.params.id);
      if (room) {
        const lastModified = new Date(room.updatedAt);
        res.set("Last-Modified", lastModified.toUTCString());
        const challenge = req.headers["if-modified-since"];
        if (challenge && new Date(challenge) >= lastModified) {
          // 304-Not Modified
          res.status(304).end();
        } else {
          /**
           * TODO!!! Anonymize other player IDs.
           */
          res.status(200).json({
            roomId: room._id,
            ...room.data,
          });
        }
      } else {
        res.status(404).json({ message: `game ${req.params.id} not found` });
      }
    },
  }),
);

/******************************************************************************
 * ### POST rooms/{id}/guests
 *
 * The method by which the client adds players to a room.
 ******************************************************************************/
rooms.post(
  ROUTES.rooms.methods.postGuest.path,
  validated({
    schemas: ROUTES.rooms.methods.postGuest.schemas,
    handler: async (req, res) => {
      const room = allRooms.find((r) => r._id === req.params.id);
      if (room) {
        const playerNames = [
          room.data.host.name,
          ...room.data.guests.map((g) => g.name),
        ];
        if (playerNames.includes(req.body.guestName)) {
          // 409-Conflict
          res
            .status(409)
            .json({ message: `room already has player ${req.body.guestName}` });
        } else {
          const now = new Date().toISOString();
          const guest = {
            id: `${req.body.guestName}-${now}`,
            name: req.body.guestName,
          };
          room.data.guests.push(guest);
          room.updatedAt = now;
          res.status(200).json({ playerId: guest.id });
        }
      } else {
        // 404-Not Found
        res.status(404).json({ message: `room ${req.params.id} not found` });
      }
    },
  }),
);
