import type { Message } from "@server/types";
import type { messageKeys } from "./keys";

// "Loose autocomplete" pattern
type Key = (typeof messageKeys)[number] | (string & {});

/******************************************************************************
 * ### msg
 *
 * Helper for generating message objects.
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
): string {
  const template = bundle[message.key] ?? message.key;
  if (!message.params) return template;
  const params = message.params;
  return template.replace(/\{([a-zA-Z0-9.]+)\}/g, (_, key) => {
    const val = params[key] ?? bundle[key];
    if (val === undefined) return `{${key}}`;
    if (typeof val === "object") return resolve(val, bundle);
    return String(val);
  });
}
