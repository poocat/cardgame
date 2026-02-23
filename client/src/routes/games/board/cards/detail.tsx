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
  return <div className="game-dialog__card-menu">{props.children}</div>;
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
