import { ButtonBase } from "@client/components";
import "./styles.css";

export const Mini = (props: {
  onClick?: () => void;
  placeholder?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = ["thumbnail-card", "thumbnail-card--mini"];
  if (props.onClick) classNames.push("thumbnail-card--clickable");
  if (props.placeholder) classNames.push("thumbnail-card--placeholder");
  const className = classNames.join(" ");

  const content = <div className={className}>{props.children}</div>;

  return props.onClick ? (
    <ButtonBase onClick={props.onClick}>{content}</ButtonBase>
  ) : (
    content
  );
};
