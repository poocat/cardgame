import type { Match } from "@client/utils/messages";
import { useMessages } from "@client/utils/messages";
import { useCallback, useMemo } from "react";
import type { Message } from "./types";

const PATTERN = /\{([a-zA-Z0-9.]+)\}/g;
const MAX_RECURSION_DEPTH = 5;

export const Msg = (props: { value: Message | null; textOnly?: boolean }) => {
  const { lookup } = useMessages();

  const resolve = useCallback(
    (message: Message, depth: number = 0) => {
      // First, attempt to find a matching entry in either the icon or locale
      // bundle.
      const top = lookup(message.key, { textOnly: props.textOnly });
      if (depth > MAX_RECURSION_DEPTH) return [top];
      if (top.type === "icon") return [top];
      if (!PATTERN.test(top.value)) return [top];
      // Parse the text recursively for any other replacements.
      const segs: Match[] = [];
      const params = message.params ?? {};
      top.value.split(PATTERN).forEach((sub, i) => {
        const token = i % 2 === 0 ? null : sub;
        if (!token) {
          // Doesn't match the token syntax. Preserve text as-is.
          segs.push({ type: "text", value: sub });
        } else if (params[token]) {
          // Token matches something in params. Pass the match deeper in case
          // of nested messages/tokens.
          const val = params[token];
          const msg = typeof val === "object" ? val : { key: String(val) };
          segs.push(...resolve(msg, depth + 1));
        } else {
          const val = lookup(token, { textOnly: props.textOnly });
          if (val.type === "icon") {
            segs.push(val);
          } else {
            segs.push(...resolve({ key: val.value }, depth + 1));
          }
        }
      });
      return segs;
    },
    [lookup, props.textOnly],
  );

  const segments = useMemo(() => {
    if (props.value === null) return [];
    return resolve(props.value);
  }, [resolve, props.value]);

  return (
    <span>
      {segments.map((s, i) =>
        s.type === "icon" ? (
          <span
            key={`${i}-${s.type}`}
            className="icon"
            role="img"
            aria-label={s.alt}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: content is server-sanitized at bundle load via DOMPurify (svg profile).
            dangerouslySetInnerHTML={{ __html: s.value }}
          />
        ) : (
          <span key={`${i}-${s.type}`}>{s.value}</span>
        ),
      )}
    </span>
  );
};
