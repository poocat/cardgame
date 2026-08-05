import type { CardType } from "./types";

/******************************************************************************
 * ### CardDetailContainer
 *
 * The container for all the elements displayed when a card is enlarged in a
 * dialog.
 ******************************************************************************/
export const CardDetailContainer = (props: { children?: React.ReactNode }) => {
  return <div className="game-dialog__card-container">{props.children}</div>;
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

/******************************************************************************
 * ### CardDetailHeader
 ******************************************************************************/
export const CardDetailHeader = (props: { children: React.ReactNode }) => {
  return <div className="game-dialog__card-header">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailName
 ******************************************************************************/
export const CardDetailName = (props: { children: React.ReactNode }) => {
  return <div className="game-dialog__card-name">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailLink
 ******************************************************************************/
export const CardDetailLink = (props: { url: string }) => {
  return (
    <div className="game-dialog__card-link">
      <a href={props.url}>source</a>
    </div>
  );
};

/******************************************************************************
 * ### CardDetailActions
 ******************************************************************************/
export const CardDetailActions = (props: { children?: React.ReactNode }) => {
  return <div className="game-dialog__card-actions">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailTriggerInstructions
 ******************************************************************************/
export const CardDetailTriggerInstructions = (props: {
  children?: React.ReactNode;
}) => {
  return (
    <div className="game-dialog__card-trigger-instructions">
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### CardDetailTextBox
 ******************************************************************************/
export const CardDetailTextBox = (props: { children?: React.ReactNode }) => {
  return <div className="game-dialog__card-textbox">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailMenuContainer
 ******************************************************************************/
export const CardDetailMenuContainer = (props: {
  children?: React.ReactNode;
}) => {
  return <div className="game-dialog__menu">{props.children}</div>;
};
