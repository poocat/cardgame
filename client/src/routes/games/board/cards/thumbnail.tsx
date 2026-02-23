import { ButtonBase } from "@client/components";
import "./styles.css";

export type ThumbnailHighlight = "selectable" | "selected" | "none";

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

export const Thumbnail = (props: {
  onClick?: () => void;
  variant: "producer" | "consumer" | "placeholder";
  children?: React.ReactNode;
}) => {
  const classNames = ["game-card", `game-card--${props.variant}`];
  if (props.onClick) classNames.push("game-card--clickable");
  const className = classNames.join(" ");

  const content = <div className={className}>{props.children}</div>;

  return props.onClick ? (
    <ButtonBase onClick={props.onClick}>{content}</ButtonBase>
  ) : (
    content
  );
};
