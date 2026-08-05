import type { CSSProperties } from "react";
import "@client/features/cards/styles.css";

export const CardPile = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile">{props.children}</div>;
};

export const CardPileLabel = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile__label">{props.children}</div>;
};

export const CardPileStack = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile__stack">{props.children}</div>;
};

export const CardPileStackItem = (props: {
  index?: number;
  children?: React.ReactNode;
}) => {
  const styleProps = {
    "--game-card-pile-item-index": props.index ?? 0,
  } as CSSProperties;
  return (
    <div className="game-card-pile__item" style={styleProps}>
      {props.children}
    </div>
  );
};
