import type { Message } from "@server/types";
import type { messageKeys } from "./keys";

// "Loose autocomplete" pattern
type Key = (typeof messageKeys)[number] | (string & {});

export function msg(key: Key, params?: Message["params"]): Message {
  return params ? { key, params } : { key };
}

export function resolve(message: Message, map: Record<string, string>): string {
  const template = map[message.key] ?? message.key;
  if (!message.params) return template;
  const params = message.params;
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const val = params[name];
    if (val === undefined) return `{${name}}`;
    if (typeof val === "object") return resolve(val, map);
    return String(val);
  });
}
