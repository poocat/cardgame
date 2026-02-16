import "./styles.css";
import type { Border, Color, Size } from "./types";

/******************************************************************************
 * ### ButtonBase
 *
 * Reset styles for buttons. Use as a wrapper for custom button content.
 ******************************************************************************/
export const ButtonBase = (props: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      className="btn-base"
      disabled={!!props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

/******************************************************************************
 * ### Button
 *
 * Standard button with rounded ends and customizable appearance.
 ******************************************************************************/
export const Button = (props: {
  onClick: () => void;
  children: React.ReactNode;
  size?: Size;
  color?: Color;
  border?: Border;
  rounded?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}) => {
  const classNames = ["btn"];
  if (props.size) classNames.push(`btn--size-${props.size}`);
  if (props.color) classNames.push(`btn--col-${props.color}`);
  if (props.border) classNames.push(`btn--border-${props.border}`);
  if (props.rounded) classNames.push(`btn--rounded`);
  if (props.fullWidth) classNames.push(`btn--fullwidth`);
  const className = classNames.join(" ");

  return (
    <ButtonBase onClick={props.onClick} disabled={!!props.disabled}>
      <div className={className}>{props.children}</div>
    </ButtonBase>
  );
};

/******************************************************************************
 * ### SelectButton
 *
 * Toggle button with checkbox symbol for selection states.
 ******************************************************************************/
export const SelectButton = (props: {
  selected: boolean;
  onClick: () => void;
  label: string;
  size?: Size;
  color?: Color;
  border?: Border;
  rounded?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}) => {
  const symbol = props.selected ? "☑" : "☐";
  const classNames = ["select-btn"];
  if (props.size) classNames.push(`select-btn--size-${props.size}`);
  if (props.color) classNames.push(`select-btn--col-${props.color}`);
  if (props.border) classNames.push(`select-btn--border-${props.border}`);
  if (props.rounded) classNames.push(`select-btn--rounded`);
  if (props.fullWidth) classNames.push(`btn--fullwidth`);
  const className = classNames.join(" ");

  return (
    <ButtonBase onClick={props.onClick} disabled={!!props.disabled}>
      <div className={className}>
        {symbol} {props.label}
      </div>
    </ButtonBase>
  );
};
