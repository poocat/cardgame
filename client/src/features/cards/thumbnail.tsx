/**
 * Components for composing a thumbnail form factor card presentation.
 *
 * A thumbnail card uses card art that omits various details, such as action
 * instructions or triggers.
 *
 * Thumbnail cards are typically clickable, and clicking on one should result
 * in the presentation of an expanded "fullsize" version of the card.
 *
 * They are typically presented inside of a container. Styles applied to this
 * container will indicate various aspects of the card's state in a game.
 */
import { ButtonBase } from "@client/components";
import "./styles.css";

export type ThumbnailEmphasis = "solid" | "outlined" | "animated";

/******************************************************************************
 * ### ThumbnailCardContainer
 *
 * Container for thumbnail card or card placeholder.
 *
 * Can be used to emphasize the card with a "solid" background, an "outlined"
 * background, or an "animated" background (which is just the "solid"
 * background that pulses).
 ******************************************************************************/
export const ThumbnailCardContainer = (props: {
  emphasis?: ThumbnailEmphasis;
  exhausted?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = ["card-thumbnail-container"];
  if (props.emphasis)
    classNames.push(`card-thumbnail-container--emphasis-${props.emphasis}`);
  if (props.exhausted) classNames.push(`card-thumbnail-container--exhausted`);
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### ThumbnailCard
 *
 * Use to contain the content of a thumbnail card, and optionally make it
 * clickable.
 ******************************************************************************/
export const ThumbnailCard = (props: {
  onClick?: () => void;
  mini?: boolean;
  placeholder?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = ["card-thumbnail"];
  if (props.mini) classNames.push("card-thumbnail--mini");
  if (props.onClick) classNames.push("card-thumbnail--clickable");
  if (props.placeholder) classNames.push("card-thumbnail--placeholder");
  const className = classNames.join(" ");

  const content = <div className={className}>{props.children}</div>;

  return props.onClick ? (
    <ButtonBase onClick={props.onClick}>{content}</ButtonBase>
  ) : (
    content
  );
};
