import type { Message } from "@server/types";

export function msg(key: string, params?: Message["params"]): Message {
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
