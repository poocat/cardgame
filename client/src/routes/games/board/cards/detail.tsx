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
 * ### CardDetailActionSelect
 ******************************************************************************/
export const CardDetailAction = (props: {
  value: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  onChange: () => void;
}) => {
  const { value, label, selected, disabled, onChange } = props;

  return (
    <div>
      <span>
        <input
          id={value}
          type="checkbox"
          disabled={disabled}
          checked={selected}
          onChange={onChange}
        />
        {label && <label htmlFor={value}>{label}</label>}
      </span>
    </div>
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
