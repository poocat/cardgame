import type { messageSchema } from "@common/api/digests";
import type { messageKeys } from "@common/text/keys";
import type z from "zod";

type Message = z.infer<typeof messageSchema>;
type Key = (typeof messageKeys)[number];

/******************************************************************************
 * ### msg
 *
 * Helper for generating message objects. Only accepts keys that are used for
 * messages emitted from the game engine, not from the card definitions
 * themselves.
 ******************************************************************************/
export function msg(key: Key, params?: Message["params"]): Message {
  return params ? { key, params } : { key };
}
