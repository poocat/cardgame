/**
 * The "digest" is a view of a game's data which reflects how the visual and
 * interactive elements might be arranged.
 */
import z from "zod";
import {
  actionTypes,
  activityTypes,
  cardTypes,
  choiceTypes,
} from "@common/game/enums";

const idSchema = z.uuid();

/******************************************************************************
 * ### Game Digest
 ******************************************************************************/

/** */
const activityDigestSchema = z.strictObject({
  type: z.union(activityTypes.map((t) => z.literal(t))),
  choice: z.strictObject({
    name: z.string(),
    type: z.union(choiceTypes.map((t) => z.literal(t))),
    min: z.number().int().min(0),
    max: z.number().int().min(0).nullable(),
    values: z.array(z.string()),
    choosingPlayerId: idSchema,
    instructions: z.string(),
  }),
});

const actionDigestSchema = z.strictObject({
  id: idSchema,
  type: z.union(actionTypes.map((t) => z.literal(t))),
  instructions: z.string(),
});

const chipDigestSchema = z.strictObject({
  id: idSchema,
});

export const visibleCardDigestSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  type: z.union(cardTypes.map((t) => z.literal(t))),
  actions: z.array(actionDigestSchema),
  chips: z.array(chipDigestSchema),
});

export const inPlayCardDigestSchema = visibleCardDigestSchema.extend({
  exhausted: z.boolean(),
});

const hiddenCardDigestSchema = z.strictObject({
  id: idSchema,
});

const playerDigestCommonSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  cardsInDeck: z.array(hiddenCardDigestSchema),
  cardsInPlay: z.array(inPlayCardDigestSchema),
  chipsInReserve: z.array(chipDigestSchema),
});

const observingPlayerDigestSchema = playerDigestCommonSchema.extend({
  cardsInHand: z.array(visibleCardDigestSchema),
});

const otherPlayerDigestSchema = playerDigestCommonSchema.extend({
  cardsInHand: z.array(hiddenCardDigestSchema),
});

export const gameDigestSchema = z.strictObject({
  playerTakingTurnId: idSchema,
  activity: activityDigestSchema,
  /** Optional because, if spectating, all players are "other players". */
  observingPlayer: observingPlayerDigestSchema.optional(),
  otherPlayers: z.array(otherPlayerDigestSchema),
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
