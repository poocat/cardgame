import "./styles.css";
import type { Size } from "./types";

/******************************************************************************
 * ### Input
 *
 * Text input field with consistent styling.
 ******************************************************************************/
export const Input = (props: {
  value: string;
  onChange: (value: string) => void;
  size?: Size;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const classNames = ["input"];
  if (props.size) classNames.push(`input--size-${props.size}`);
  const className = classNames.join(" ");
  return (
    <input
      type="text"
      className={className}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
      disabled={props.disabled}
    />
  );
};
