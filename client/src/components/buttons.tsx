import type { Color } from "@client/utils/colors";
import type { CSSProperties } from "react";

const buttonBaseStyleProps: CSSProperties = {
  font: "inherit",
  color: "inherit",
  border: "none",
  backgroundColor: "transparent",
  padding: 0,
};

/******************************************************************************
 * ### ButtonBase
 *
 * Common styling (or lack of styling) for buttons and button-like elements.
 ******************************************************************************/
export const ButtonBase = (props: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      disabled={!!props.disabled}
      style={buttonBaseStyleProps}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

/******************************************************************************
 * ### Button
 ******************************************************************************/
export const Button = (props: {
  onClick: () => void;
  children: React.ReactNode;
  height: number;
  fontSize: number;
  color: Color;
  disabled?: boolean;
  horizontalPadding?: number;
}) => {
  const borderRadius = props.height / 2;
  const styleProps: CSSProperties = {
    height: props.height,
    minWidth: props.height,
    fontSize: props.fontSize,
    backgroundColor: props.color.alpha(1),
    alignItems: "center",
    alignContent: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: borderRadius,
  };
  if (props.disabled) {
    styleProps.color = props.color.scale(0.75);
  }
  if (props.horizontalPadding) {
    styleProps.paddingInline = props.horizontalPadding;
  }
  return (
    <ButtonBase onClick={props.onClick} disabled={!!props.disabled}>
      <div style={styleProps}>{props.children}</div>
    </ButtonBase>
  );
};

/******************************************************************************
 * ### ToggleButton
 ******************************************************************************/
export const SelectButton = (props: {
  selected: boolean;
  onClick: () => void;
  label: string;
  minHeight: number;
  fontSize: number;
  color: Color;
  disabled?: boolean;
  fullWidth?: boolean;
  horizontalPadding?: number;
}) => {
  const borderRadius = props.minHeight / 2;
  const symbol = props.selected ? "☑" : "☐";
  const styleProps: CSSProperties = {
    minHeight: props.minHeight,
    minWidth: props.minHeight,
    fontSize: props.fontSize,
    backgroundColor: props.color.alpha(1),
    alignItems: "center",
    alignContent: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: borderRadius,
    clipPath: "circle(80%)",
    paddingInline: 10,
  };
  if (props.disabled) {
    styleProps.color = props.color.scale(0.75);
  }
  if (props.horizontalPadding) {
    styleProps.paddingInline = props.horizontalPadding;
  }
  return (
    <ButtonBase onClick={props.onClick} disabled={!!props.disabled}>
      <div style={styleProps}>
        <div>
          {symbol} {props.label}
        </div>
      </div>
    </ButtonBase>
  );
};
