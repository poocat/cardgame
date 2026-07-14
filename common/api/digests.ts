/**
 * The "digest" is a view of a game's data which reflects how the visual and
 * interactive elements might be arranged.
 *
 * A type that is defined for the storage layer (e.g. the `Message` type) may be
 * redefined here as a schema. Even if the shapes are identical, the definitions
 * are separate so that the transport layer is allowed to drift from the storage
 * layer.
 */

import {
  actionTypes,
  activityTypes,
  cardTypes,
  choiceTypes,
} from "@common/game/enums";
import z from "zod";

const idSchema = z.uuid();

/******************************************************************************
 * ### Game Digest
 ******************************************************************************/
export const messageSchema = z.strictObject({
  key: z.string(),
  get params() {
    return z
      .record(z.string(), z.union([z.string(), z.number(), messageSchema]))
      .optional();
  },
});

/** */
export const choiceValueDigestSchema = z.strictObject({
  value: z.string(),
  // All actions and some chips can be associated with a card.
  onCardId: z.string().nullable(),
  label: messageSchema.nullable(),
});

export const activityDigestSchema = z.strictObject({
  type: z.union(activityTypes.map((t) => z.literal(t))),
  explanation: messageSchema,
  choice: z.strictObject({
    name: z.string(),
    type: z.union(choiceTypes.map((t) => z.literal(t))),
    min: z.number().int().min(0),
    max: z.number().int().min(0).nullable(),
    values: z.array(choiceValueDigestSchema),
    choosingPlayerId: idSchema,
    instructions: messageSchema,
  }),
  previouslyChosenValues: z.array(z.string()),
});

export const actionDigestSchema = z.strictObject({
  id: idSchema,
  type: z.union(actionTypes.map((t) => z.literal(t))),
  instructions: messageSchema.optional(),
  annotations: z.array(messageSchema),
});

export const chipDigestSchema = z.strictObject({
  id: idSchema,
});

export const visibleCardDigestSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  display: messageSchema,
  triggerInstructions: messageSchema.nullable(),
  imageSourceUrl: z.string().optional(),
  type: z.union(cardTypes.map((t) => z.literal(t))),
  subtype: messageSchema.nullable(),
  lastMovedOnTick: z.number().int(),
  lastMovedOnTurn: z.number().int(),
  actions: z.array(actionDigestSchema),
  chips: z.array(chipDigestSchema),
});

export const inPlayCardDigestSchema = visibleCardDigestSchema.extend({
  exhausted: z.boolean(),
});

export const hiddenCardDigestSchema = z.strictObject({
  id: idSchema,
});

const playerDigestCommonSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  cardsInDeck: z.array(hiddenCardDigestSchema),
  cardsInPlay: z.array(inPlayCardDigestSchema),
  cardsInDiscard: z.array(hiddenCardDigestSchema),
  cardsInDiscardVisible: z.array(visibleCardDigestSchema),
  chipsInReserve: z.array(chipDigestSchema),
  chipsinChannel: z.array(chipDigestSchema),
});

export const observingPlayerDigestSchema = playerDigestCommonSchema.extend({
  cardsInHand: z.array(visibleCardDigestSchema),
});

export const otherPlayerDigestSchema = playerDigestCommonSchema.extend({
  cardsInHand: z.array(hiddenCardDigestSchema),
});

export const gameDigestSchema = z.strictObject({
  playerTakingTurnId: idSchema,
  activity: activityDigestSchema,
  /** Optional because, if spectating, all players are "other players". */
  observingPlayer: observingPlayerDigestSchema.optional(),
  otherPlayers: z.array(otherPlayerDigestSchema),
  playerOrder: z.array(idSchema),
  winner: z.strictObject({ id: idSchema, name: z.string() }).nullable(),
});

/******************************************************************************
 * ### Room Digest
 ******************************************************************************/

/** */
const roomPlayerSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
});

export const roomDigestSchema = z.strictObject({
  host: roomPlayerSchema,
  guests: z.array(roomPlayerSchema),
});
