import type { Message } from "@server/types";
import type { messageKeys } from "./keys";

type Key = (typeof messageKeys)[number];

/******************************************************************************
 * ### msg
 *
 * Helper for generating message objects. Only accepts keys that are used for
 * messages emitted from the game engine (not cards).
 ******************************************************************************/
export function msg(key: Key, params?: Message["params"]): Message {
  return params ? { key, params } : { key };
}

/******************************************************************************
 * ### resolve
 *
 * Uses the given localized/themed `bundle` to generate a string from the
 * given `message` object.
 *
 * The value corresponding to the message `key` (or the key itself, if not
 * found in the bundle) may contain any some number of tokens, denoted with
 * curly braces.
 *
 * This will attempt to replace those tokens, first by looking for a matching
 * key in the message `params`, then by looking for a matching key in the given
 * `bundle`. If no matches are found, the token is not replaced.
 *
 * Tokens may also be replaced by messages, each with their own tokens.
 * So, tokens are replaced recursively.
 *
 * Example:
 * ```
 * >>> resolve(
 *   { key: "hello", params: { name: "World" }},
 *   { hello: "Hello, {name}{emphasis}", emphasis: "!"},
 * )
 * "Hello, World!"
 * ```
 ******************************************************************************/
export function resolve(
  message: Message,
  bundle: Record<string, string>,
  depth = 0,
): string {
  const template = bundle[message.key] ?? message.key;
  if (depth > 5) return template;
  const params = message.params ?? {};
  return template.replace(/\{([a-zA-Z0-9.]+)\}/g, (_, key) => {
    // Look for replacement, first in params, then in the bundle itself.
    const val = params[key] ?? bundle[key];
    // Keep token intact if there's nothing to replace it with.
    if (val === undefined) return `{${key}}`;
    // Params can map to messages.
    else if (typeof val === "object") return resolve(val, bundle, depth + 1);
    // Tokens can resolve to a string with more tokens.
    return resolve({ key: String(val) }, bundle, depth + 1);
  });
}
