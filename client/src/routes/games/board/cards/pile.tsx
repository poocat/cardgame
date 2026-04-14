import "./styles.css";

export const CardPile = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile">{props.children}</div>;
};

export const CardPileLabel = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile__label">{props.children}</div>;
};

export const CardPileStack = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile__stack">{props.children}</div>;
};

export const CardPileStackItem = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-pile__item">{props.children}</div>;
};
