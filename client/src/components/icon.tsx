import type { Message } from "@client/utils/messages";
import { useMessages } from "@client/utils/messages";

/******************************************************************************
 * ### Icon
 *
 * Renders the themed icon registered under the given key, or nothing at all
 * when the icon bundle has no entry for it.
 *
 * Renders the icon on its own, so callers can position it independently of any
 * text around it, rather than letting `<Msg/>` splice it into a template.
 ******************************************************************************/
export const Icon = (props: {
  msg: Message;
  /** Use to render the icon as a purely visual element; will be skipped by screen readers. */
  decorative?: boolean;
  /** Defaults to the shared inline `icon` class, sized to the inherited font. */
  className?: string;
}) => {
  const { lookup } = useMessages();
  const match = lookup(props.msg.key);
  if (match.type !== "icon") return null;

  const className = props.className ?? "icon";
  if (props.decorative) {
    return (
      <span
        className={className}
        aria-hidden="true"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: content is server-sanitized at bundle load via DOMPurify (svg profile).
        dangerouslySetInnerHTML={{ __html: match.value }}
      />
    );
  } else {
    /**
     * Compose alt text from a text-only resolution of the same message. Note,
     * since this component only receives the key, it cannot resolve a message
     * recursively. If the message has any tokens, those tokens will pass
     * through verbatim to the alt text.
     */
    const altMatch = lookup(props.msg.key, { textOnly: true });
    return (
      <span
        className={className}
        role="img"
        aria-label={altMatch.value || props.msg.key}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: content is server-sanitized at bundle load via DOMPurify (svg profile).
        dangerouslySetInnerHTML={{ __html: match.value }}
      />
    );
  }
};
