import type { Message, MessageKey } from "@common/text/types";

/******************************************************************************
 * ### msg
 *
 * Helper for generating message objects. Only accepts keys that are used for
 * messages emitted from the game engine, not from the card definitions
 * themselves.
 ******************************************************************************/
export function msg(key: MessageKey, params?: Message["params"]): Message {
  return params ? { key, params } : { key };
}
