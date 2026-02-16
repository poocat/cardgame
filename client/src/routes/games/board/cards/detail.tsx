import { SelectButton } from "@client/components";
import {
  detailCardFooterHeight,
  detailCardHeight,
  detailCardWidth,
} from "./constants";

/******************************************************************************
 * ### CardDetailContainer
 ******************************************************************************/
export const CardDetailContainer = (props: { children?: React.ReactNode }) => {
  return (
    <div
      style={{
        width: detailCardWidth,
        height: detailCardHeight + detailCardFooterHeight,
      }}
    >
      {props.children}
    </div>
  );
};

export const CardDetailActionContainer = (props: {
  children?: React.ReactNode;
}) => {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### CardDetailFooterContainer
 ******************************************************************************/
export const CardDetailFooterContainer = (props: {
  children?: React.ReactNode;
}) => {
  return (
    <div
      style={{
        height: detailCardFooterHeight,
        display: "flex",
        flexDirection: "row",
        alignItems: "start",
        justifyContent: "end",
        margin: 5,
      }}
    >
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
