import type { CSSProperties } from "react";
import "./styles.css";

export const CardPile = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile">{props.children}</div>;
};

export const CardPileItem = (props: {
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
