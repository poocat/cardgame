import { ButtonBase } from "@client/components";
import "./styles.css";

export type ThumbnailHighlight = "selectable" | "selected" | "none";

/******************************************************************************
 * ### ThumbnailContainer
 *
 * Container for thumbnail card or card placeholder.
 *
 * Can be used to highlight the card as "selectable" (card is selectable, or
 * has a selectable item on it) or "selected" (card or item on card was selected
 * for a previous choice in the current activity).
 ******************************************************************************/
export const ThumbnailContainer = (props: {
  highlight: ThumbnailHighlight;
  exhausted?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = [
    "game-card-container",
    `game-card-container--${props.highlight}`,
  ];
  if (props.exhausted) classNames.push(`game-card-container--exhausted`);
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### Thumbnail
 *
 * Use to contain the content of a thumbnail card, and optionally make it
 * clickable.
 ******************************************************************************/
export const Thumbnail = (props: {
  onClick?: () => void;
  placeholder?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = ["game-card"];
  if (props.onClick) classNames.push("game-card--clickable");
  if (props.placeholder) classNames.push("game-card--placeholder");
  const className = classNames.join(" ");

  const content = <div className={className}>{props.children}</div>;

  return props.onClick ? (
    <ButtonBase onClick={props.onClick}>{content}</ButtonBase>
  ) : (
    content
  );
};
