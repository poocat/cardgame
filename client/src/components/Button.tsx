import { ButtonBase } from "./ButtonBase";

export const Button = (props: {
  height: number;
  fontSize: number;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  return (
    <ButtonBase onClick={props.onClick} disabled={!!props.disabled}>
      <div
        style={{
          height: props.height,
          minWidth: props.height,
          fontSize: props.fontSize,
          backgroundColor: props.color,
          alignItems: "center",
          alignContent: "center",
          justifyContent: "center",
          textAlign: "center",
          borderRadius: "50%",
        }}
      >
        {props.children}
      </div>
    </ButtonBase>
  );
};
