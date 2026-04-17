import Markdown from "react-markdown";

/******************************************************************************
 * ### Copy
 *
 * Thin wrapper around `<Markdown/>` that pulls in custom styles. Use with
 * markdown files served from the backend (e.g. for the "about" page, or the
 * "rulebook").
 ******************************************************************************/
export const Copy = (props: { children?: string | null }) => {
  return (
    <div className="copy">
      <Markdown>{props.children}</Markdown>
    </div>
  );
};
