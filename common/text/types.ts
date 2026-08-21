import type { messageSchema } from "@common/api/digests";
import type { messageKeys } from "@common/text/keys";
import type z from "zod";

export type Message = z.infer<typeof messageSchema>;

/**
 * A message key emitted by the game engine, validated at compile time and
 * guaranteed by `locales.test.ts` to be present in every locale bundle.
 *
 * Keys originating from card definitions are not part of this union and cannot
 * be checked this way; the few call sites that handle them cast explicitly.
 */
export type MessageKey = (typeof messageKeys)[number];
