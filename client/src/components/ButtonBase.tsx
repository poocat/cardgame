import type { CSSProperties } from "react";

const defaultButtonStyleProps: CSSProperties = {
  fontFamily: "inherit",
  borderStyle: "inherit",
  borderColor: "inherit",
  backgroundColor: "inherit",
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
}) => {
  return (
    <button
      type="button"
      style={defaultButtonStyleProps}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};
