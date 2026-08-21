import { useDocumentTitle } from "@client/utils/title";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { Border, Color, EdgeVariant, Spacing } from "./types";
import "./styles.css";

type Orientation = "horizontal" | "vertical";

export const Stack = (props: {
  orientation: Orientation;
  spacing: Spacing;
  children: React.ReactNode;
  wrap?: boolean;
  stretch?: boolean;
}) => {
  const classNames = [
    "stack",
    `stack--spacing-${props.spacing}`,
    `stack--orient-${props.orientation}`,
  ];
  if (props.wrap) classNames.push(`stack--wrap`);
  if (props.stretch) classNames.push(`stack--stretch`);
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

export const Box = (props: {
  spacing?: Spacing;
  color?: Color;
  border?: Border;
  fullWidth?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = ["box"];
  if (props.spacing) classNames.push(`box--spacing-${props.spacing}`);
  if (props.color) classNames.push(`box--color-${props.color}`);
  if (props.border) classNames.push(`box--border-${props.border}`);
  if (props.fullWidth) classNames.push(`box--fullwidth`);
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

export const Divider = () => {
  return <div className="divider" />;
};

/******************************************************************************
 * ### PageTitle
 *
 * The page's `<h1>`. Every route should render exactly one, so that headings
 * inside the route (e.g. player names) have a level-one ancestor to nest
 * under, and so heading navigation has somewhere to land.
 *
 * Hidden by default: still in the accessibility tree, but taking up no space.
 * Pass `visible` where the design has room for a real title.
 *
 * Also sets the document title, so that the heading and the browser tab cannot
 * drift apart.
 ******************************************************************************/
export const PageTitle = (props: { children: string; visible?: boolean }) => {
  useDocumentTitle(props.children);

  if (props.visible) return <h1>{props.children}</h1>;
  return (
    <VisuallyHidden asChild>
      <h1>{props.children}</h1>
    </VisuallyHidden>
  );
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
