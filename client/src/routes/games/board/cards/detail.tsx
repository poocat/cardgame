import type { CardType } from "../types";

/******************************************************************************
 * ### CardDetailContainer
 ******************************************************************************/
export const CardDetailContainer = (props: { children?: React.ReactNode }) => {
  return <div className="game-dialog__card-container">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailMenuContainer
 ******************************************************************************/
export const CardDetailMenuContainer = (props: {
  children?: React.ReactNode;
}) => {
  return <div className="game-dialog__menu">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailBody
 ******************************************************************************/
export const CardDetailBody = (props: {
  type: CardType;
  children?: React.ReactNode;
}) => {
  return (
    <div className={`game-dialog__card game-dialog__card--${props.type}`}>
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### CardDetailBackground
 ******************************************************************************/
export const CardDetailBackground = (props: { children?: React.ReactNode }) => {
  return <div className="game-dialog__card-background">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailForeground
 ******************************************************************************/
export const CardDetailForeground = (props: { children?: React.ReactNode }) => {
  return <div className="game-dialog__card-foreground">{props.children}</div>;
};
