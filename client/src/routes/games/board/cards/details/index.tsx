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
  return <div style={{ height: detailCardFooterHeight }}>{props.children}</div>;
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
 * ### CardDetailChipSelect
 *
 * Chip selection is not done on a chip-by-chip basis.
 ******************************************************************************/
export const CardDetailChipSelect = (props: {
  numSelected: number;
  numRemaining: number;
  disableIncrement: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}) => {
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <div>{props.numRemaining}</div>
        <div>{props.numSelected}</div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          disabled={props.numSelected < 1}
          onClick={props.onDecrement}
        >
          less
        </button>
        <button
          type="button"
          disabled={props.disableIncrement}
          onClick={props.onIncrement}
        >
          more
        </button>
      </div>
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
      {/* <div>{props.card.name}</div>
      {props.card.actions.map((action) => (
        <div key={action.id}>
          <CardDetailActionSelect
            value={action.id}
            label={`[${action.type}] ${action.instructions}`}
          />
        </div>
      ))} */}
    </div>
  );
};
