import type { Border, Color, EdgeVariant, Size, Spacing } from "./types";

type Orientation = "horizontal" | "vertical";

export const Stack = (props: {
  orientation: Orientation;
  spacing: Spacing;
  children: React.ReactNode;
}) => {
  const className = `stack stack--spacing-${props.spacing} stack--orient-${props.orientation}`;
  return <div className={className}>{props.children}</div>;
};

export const Box = (props: {
  spacing?: Spacing;
  color?: Color;
  size?: Size;
  border?: Border;
  fullWidth?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = ["box"];
  if (props.spacing) classNames.push(`box--spacing-${props.spacing}`);
  if (props.color) classNames.push(`box--color-${props.color}`);
  if (props.border) classNames.push(`box--border-${props.border}`);
  if (props.size) classNames.push(`box--size-${props.size}`);
  if (props.fullWidth) classNames.push(`box--fullwidth`);
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

export const Divider = () => {
  return <div className="divider" />;
};

/******************************************************************************
 * ### Edge
 *
 * A zero-height, full-width container that can be used to align elements along
 * the bottom edge of its previous sibling.
 ******************************************************************************/
export const Edge = (props: {
  variant: EdgeVariant;
  children?: React.ReactNode;
}) => {
  return (
    <div className="abutment">
      <div className={`edge edge--${props.variant}`}>{props.children}</div>
    </div>
  );
};
