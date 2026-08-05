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

/**
 * A message; used across instructions, explanations, annotations, value labels,
 * et cetera.
 */
export const messageSchema = z.strictObject({
  key: z.string(),
  get params() {
    return z
      .record(z.string(), z.union([z.string(), z.number(), messageSchema]))
      .optional();
  },
});

/**
 * The choosable values for the choice associated with the current activity.
 */
export const choiceValueDigestSchema = z.strictObject({
  value: z.string(),
  // All actions and some chips can be associated with a card.
  onCardId: z.string().nullable(),
  label: messageSchema.nullable(),
});

/** The entire activity digest. */
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

/**
 * An action as it is printed on a card, without any of the state belonging to
 * a particular copy of that card in a particular game.
 */
export const cardActionDefDigestSchema = z.strictObject({
  type: z.union(actionTypes.map((t) => z.literal(t))),
  instructions: messageSchema.optional(),
});

/** A printed action, plus the state of that action within a game. */
export const actionDigestSchema = cardActionDefDigestSchema.extend({
  id: idSchema,
  annotations: z.array(messageSchema),
});

/** A chip. */
export const chipDigestSchema = z.strictObject({
  id: idSchema,
});

/** Everything about a card that comes from its definition. */
export const cardDefDigestSchema = z.strictObject({
  name: z.string(),
  display: messageSchema,
  triggerInstructions: messageSchema.nullable(),
  imageSourceUrl: z.string().optional(),
  type: z.union(cardTypes.map((t) => z.literal(t))),
  subtype: messageSchema.nullable().optional(),
  actions: z.array(cardActionDefDigestSchema),
});

/**
 * Extension of the card definition to include data about a specific card in a
 * game.
 */
export const visibleCardDigestSchema = cardDefDigestSchema.extend({
  id: idSchema,
  lastMovedOnTick: z.number().int(),
  lastMovedOnTurn: z.number().int(),
  actions: z.array(actionDigestSchema),
  chips: z.array(chipDigestSchema),
});

/**
 * Extension of a card definition + game state data to include state that is
 * only relevant to a card that exists in the "in play" location.
 */
export const inPlayCardDigestSchema = visibleCardDigestSchema.extend({
  exhausted: z.boolean(),
});

/** A hidden card has no human readable data. */
export const hiddenCardDigestSchema = z.strictObject({
  id: idSchema,
});

/**
 * The base schema for player data. Should not include data that is not visible
 * to all players.
 */
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

/**
 * Extension of the player digest to include data that is visible to the
 * observing player.
 */
export const observingPlayerDigestSchema = playerDigestCommonSchema.extend({
  cardsInHand: z.array(visibleCardDigestSchema),
});

/**
 * Extension of the player digest to include data that is visible to all
 * players.
 */
export const otherPlayerDigestSchema = playerDigestCommonSchema.extend({
  cardsInHand: z.array(hiddenCardDigestSchema),
});

/** An entire game digest. */
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

/** Digest for a single player who is either a host or guest in a room. */
const roomPlayerSchema = z.strictObject({
  id: idSchema,
  name: z.string(),
});

/** An entire room digest. */
export const roomDigestSchema = z.strictObject({
  host: roomPlayerSchema,
  guests: z.array(roomPlayerSchema),
});
