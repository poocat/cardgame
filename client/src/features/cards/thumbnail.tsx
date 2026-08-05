import { ButtonBase } from "@client/components";
import "./styles.css";

export type ThumbnailEmphasis = "solid" | "outlined" | "animated";

/******************************************************************************
 * ### ThumbnailContainer
 *
 * Container for thumbnail card or card placeholder.
 *
 * Can be used to emphasize the card with a "solid" background, an "outlined"
 * background, or an "animated" background (which is just the "solid"
 * background that pulses).
 ******************************************************************************/
export const ThumbnailContainer = (props: {
  emphasis?: ThumbnailEmphasis;
  exhausted?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = ["thumbnail-card-container"];
  if (props.emphasis)
    classNames.push(`thumbnail-card-container--emphasis-${props.emphasis}`);
  if (props.exhausted) classNames.push(`thumbnail-card-container--exhausted`);
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
  const classNames = ["thumbnail-card"];
  if (props.onClick) classNames.push("thumbnail-card--clickable");
  if (props.placeholder) classNames.push("thumbnail-card--placeholder");
  const className = classNames.join(" ");

  const content = <div className={className}>{props.children}</div>;

  return props.onClick ? (
    <ButtonBase onClick={props.onClick}>{content}</ButtonBase>
  ) : (
    content
  );
};
