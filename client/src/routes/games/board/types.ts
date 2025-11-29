import type {
  inPlayCardDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import type z from "zod";

type InPlayCardDigest = z.infer<typeof inPlayCardDigestSchema>;
type VisibleCardDigest = z.infer<typeof visibleCardDigestSchema>;

export type FaceUpCardDigest = VisibleCardDigest & Partial<InPlayCardDigest>;
