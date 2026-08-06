import type {
  cardDefDigestSchema,
  chipDigestSchema,
  inPlayCardDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import type { cardTypes } from "@common/game/enums";
import type z from "zod";

/**
 * Cards are presented in one of two form factors.
 *
 * The "fullsize" form factor displays all the available details about the
 * corresponding card.
 *
 * The "thumbnail" form factor displays the card as a shorthand representation
 * of the corresponding card, and can typically be clicked on to see a
 * "fullsize" version of the card.
 */
export type CardFormFactor = "thumbnail" | "fullsize";

export type CardType = (typeof cardTypes)[number];

/** Digests of a card as it is defined, outside of the game context. */
export type CardDefDigest = z.infer<typeof cardDefDigestSchema>;
export type VisibleCardDigest = z.infer<typeof visibleCardDigestSchema>;
export type InPlayCardDigest = z.infer<typeof inPlayCardDigestSchema>;
export type FaceUpCardDigest = VisibleCardDigest & Partial<InPlayCardDigest>;
export type ChipDigest = z.infer<typeof chipDigestSchema>;
