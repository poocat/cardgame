import { SelectButton } from "@client/components";
import { detailCardHeight, detailCardWidth } from "./constants";

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

export const CardDetailBody = (props: {
  type: "producer" | "consumer";
  children?: React.ReactNode;
}) => {
  return (
    <div className={`game-dialog__card game-dialog__card--${props.type}`}>
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### CardDetailAction
 ******************************************************************************/
export const CardDetailAction = (props: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onChange: () => void;
}) => {
  const { label, selected, disabled, onChange } = props;

  return (
    <SelectButton
      fullWidth
      border="dark"
      selected={selected}
      onClick={onChange}
      size="md"
      color="action"
      disabled={disabled}
      label={label}
    />
  );
};

/******************************************************************************
 * ### CardDetail
 ******************************************************************************/
export const CardDetail = (props: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        width: detailCardWidth,
        height: detailCardHeight,
        background: "white",
        border: "1px solid",
        borderRadius: 10,
        padding: 5,
      }}
    >
      {props.children}
    </div>
  );
};
