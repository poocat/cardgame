import { useMessages } from "@client/utils/messages";

/******************************************************************************
 * ### Icon
 *
 * Renders the themed icon registered under the given key, or nothing at all
 * when the icon bundle has no entry for it.
 ******************************************************************************/
export const Icon = (props: {
  msgKey: string;
  /** Defaults to the shared inline `icon` class, sized to the inherited font. */
  className?: string;
}) => {
  const { lookup } = useMessages();
  const match = lookup(props.msgKey);
  if (match.type !== "icon") return null;
  /**
   * Compose alt text from a text-only resolution of the same message. Note,
   * since this component only receives the key, it cannot resolve a message
   * recursively. If the message has any tokens, those tokens will pass through
   * verbatim to the alt text.
   */
  const altMatch = lookup(props.msgKey, { textOnly: true });

  return (
    <span
      className={props.className ?? "icon"}
      role="img"
      aria-label={altMatch.value}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: content is server-sanitized at bundle load via DOMPurify (svg profile).
      dangerouslySetInnerHTML={{ __html: match.value }}
    />
  );
};
