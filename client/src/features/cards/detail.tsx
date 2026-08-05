import type { CardType } from "./types";

/******************************************************************************
 * ### CardDetailContainer
 *
 * The container for all the elements displayed when a card is enlarged in a
 * dialog.
 ******************************************************************************/
export const CardDetailContainer = (props: { children?: React.ReactNode }) => {
  return <div className="card-detail-container">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailBody
 ******************************************************************************/
export const CardDetailBody = (props: {
  type: CardType;
  children?: React.ReactNode;
}) => {
  return (
    <div className={`card-detail card-detail--${props.type}`}>
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### CardDetailBackground
 ******************************************************************************/
export const CardDetailBackground = (props: { children?: React.ReactNode }) => {
  return <div className="card-detail__background">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailForeground
 ******************************************************************************/
export const CardDetailForeground = (props: { children?: React.ReactNode }) => {
  return <div className="card-detail__foreground">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailHeader
 ******************************************************************************/
export const CardDetailHeader = (props: { children: React.ReactNode }) => {
  return <div className="card-detail__header">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailName
 ******************************************************************************/
export const CardDetailName = (props: { children: React.ReactNode }) => {
  return <div className="card-detail__name">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailLink
 ******************************************************************************/
export const CardDetailLink = (props: { url: string }) => {
  return (
    <div className="card-detail__link">
      <a href={props.url}>source</a>
    </div>
  );
};

/******************************************************************************
 * ### CardDetailActions
 ******************************************************************************/
export const CardDetailActions = (props: { children?: React.ReactNode }) => {
  return <div className="card-detail__actions">{props.children}</div>;
};

/******************************************************************************
 * ### CardDetailTriggerInstructions
 ******************************************************************************/
export const CardDetailTriggerInstructions = (props: {
  children?: React.ReactNode;
}) => {
  return (
    <div className="card-detail__trigger-instructions">{props.children}</div>
  );
};

/******************************************************************************
 * ### CardDetailTextBox
 *
 * A box for text printed on the card, e.g. an action's instructions when there
 * is no game in which to take the action.
 ******************************************************************************/
export const CardDetailTextBox = (props: { children?: React.ReactNode }) => {
  return <div className="card-detail__textbox">{props.children}</div>;
};
