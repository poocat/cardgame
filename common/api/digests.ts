/**
 * The "digest" is a view of a game's data which reflects how the visual and
 * interactive elements might be arranged.
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

/** */
export const choiceValueDigestSchema = z.strictObject({
  value: z.string(),
  // All actions and some chips can be associated with a card.
  onCardId: z.string().nullable(),
  label: z.string(),
});

export const activityDigestSchema = z.strictObject({
  type: z.union(activityTypes.map((t) => z.literal(t))),
  choice: z.strictObject({
    name: z.string(),
    type: z.union(choiceTypes.map((t) => z.literal(t))),
    min: z.number().int().min(0),
    max: z.number().int().min(0).nullable(),
    values: z.array(choiceValueDigestSchema),
    choosingPlayerId: idSchema,
    instructions: z.string(),
  }),
  previouslyChosenValues: z.array(z.string()),
});

export const actionDigestSchema = z.strictObject({
  id: idSchema,
  type: z.union(actionTypes.map((t) => z.literal(t))),
  instructions: z.string(),
});

export const chipDigestSchema = z.strictObject({
  id: idSchema,
});

export const visibleCardDigestSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
  type: z.union(cardTypes.map((t) => z.literal(t))),
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
