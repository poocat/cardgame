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
  return (
    <div
      className={`text-input-container text-input-container--size-${props.size}`}
    >
      <input
        type="text"
        className="text-input"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        disabled={props.disabled}
      />
    </div>
  );
};
