import type {
  cardDefDigestSchema,
  chipDigestSchema,
  inPlayCardDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import type { cardTypes } from "@common/game/enums";
import type z from "zod";

////////////////////////////////////////////////////////////////////////////////
// Digests
////////////////////////////////////////////////////////////////////////////////

/** A card as it is defined, outside of any game. */
export type CardDefDigest = z.infer<typeof cardDefDigestSchema>;
export type VisibleCardDigest = z.infer<typeof visibleCardDigestSchema>;
export type InPlayCardDigest = z.infer<typeof inPlayCardDigestSchema>;
export type FaceUpCardDigest = VisibleCardDigest & Partial<InPlayCardDigest>;
export type ChipDigest = z.infer<typeof chipDigestSchema>;

export type CardType = (typeof cardTypes)[number];
