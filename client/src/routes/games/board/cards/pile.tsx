import "./styles.css";

export const MiniCardPile = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile">{props.children}</div>;
};

export const MiniCardPileLabel = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile__label">{props.children}</div>;
};

export const MiniCardPileStack = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile__stack">{props.children}</div>;
};

export const MiniCardPileStackItem = (props: {
  children?: React.ReactNode;
}) => {
  return <div className="game-card-pile__item">{props.children}</div>;
};
