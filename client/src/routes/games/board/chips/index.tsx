import type { CSSProperties } from "react";
import { colors } from "../colors";
import { useSelector } from "../contexts";

const thumbnailChipRadius = 9;
const thumbnailChipFontSize = 10;
const thumbnailChipHighlightWidth = 3;
const detailChipRadius = 19;
const detailChipFontSize = 18;
const detailChipHighlightWidth = 5;

const commonChipCounterProps: CSSProperties = {
  alignItems: "center",
  alignContent: "center",
  justifyContent: "center",
  textAlign: "center",
  borderRadius: "50%",
  backgroundColor: colors.chips.alpha(1),
};

/******************************************************************************
 * ### ChipCounterBadge
 *
 * A zero-height container used for positioning chip counters on the edge
 * of other elements.
 ******************************************************************************/
export const ChipCounterBadge = (props: { children: React.ReactNode }) => {
  return (
    <div style={{ width: "100%", height: 0, position: "relative", top: 0 }}>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "15%",
          transform: "translateY(50%)",
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

////////////////////////////////////////////////////////////////////////////////
// Thumnail Form Factor
////////////////////////////////////////////////////////////////////////////////
const ThumbnailChipBase = (props: {
  children?: React.ReactNode;
  styleProps?: CSSProperties;
}) => {
  return (
    <div
      style={{
        width: thumbnailChipRadius * 2,
        height: thumbnailChipRadius * 2,
        fontSize: thumbnailChipFontSize,
        ...commonChipCounterProps,
        ...props.styleProps,
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### ThumbnailChipCounter
 *
 * A small chip counter, used for thumbnail-sized cards.
 ******************************************************************************/
export const ThumbnailChipCounter = (props: {
  count: number;
  numSelected?: number;
}) => {
  const counter = <ThumbnailChipBase>{props.count}</ThumbnailChipBase>;
  return props.numSelected ? (
    <div
      style={{
        minWidth: thumbnailChipRadius * 2,
        height: thumbnailChipRadius * 2,
        borderRadius: thumbnailChipRadius + thumbnailChipHighlightWidth,
        padding: thumbnailChipHighlightWidth,
        display: "flex",
        flexDirection: "row",
        gap: 3,
        backgroundColor: colors.chips.scale(0.9),
      }}
    >
      {counter}
      <ThumbnailChipBase styleProps={{ backgroundColor: "transparent" }}>
        {"→ "}
        {props.numSelected}
      </ThumbnailChipBase>
    </div>
  ) : (
    counter
  );
};

////////////////////////////////////////////////////////////////////////////////
// Detail Form Factor
////////////////////////////////////////////////////////////////////////////////
const DetailChipBase = (props: {
  children?: React.ReactNode;
  styleProps?: CSSProperties;
}) => {
  return (
    <div
      style={{
        width: detailChipRadius * 2,
        height: detailChipRadius * 2,
        fontSize: detailChipFontSize,
        ...commonChipCounterProps,
        ...props.styleProps,
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### DetailChipCounter
 *
 * Larger chip counters, used on detail-sized cards or larger chip pools.
 ******************************************************************************/
export const DetailChipCounter = (props: {
  count: number;
  numSelected?: number;
}) => {
  const counter = <DetailChipBase>{props.count}</DetailChipBase>;
  return props.numSelected ? (
    <div
      style={{
        minWidth: detailChipRadius * 2,
        height: detailChipRadius * 2,
        borderRadius: detailChipRadius + detailChipHighlightWidth,
        padding: detailChipHighlightWidth,
        display: "flex",
        flexDirection: "row",
        gap: 3,
        backgroundColor: colors.chips.scale(0.9),
      }}
    >
      {counter}
      <DetailChipBase styleProps={{ backgroundColor: "transparent" }}>
        {"→ "}
        {props.numSelected}
      </DetailChipBase>
    </div>
  ) : (
    counter
  );
};

/******************************************************************************
 * ### useChipSelector
 *
 * State management for components that let the player select chips from a given
 * pool.
 ******************************************************************************/
export function useChipSelector(args: { chipIds: string[] }): {
  numSelected: number;
  numRemaining: number;
  moreAllowed: boolean;
  addChip: () => void;
  removeChip: () => void;
} {
  const selector = useSelector();
  const selected = selector.selectedValues.filter((v) =>
    args.chipIds.includes(v),
  );
  const remaining = args.chipIds.filter((chipId) => !selected.includes(chipId));

  const addChip = () => {
    if (selector.moreValuesAllowed && remaining.length > 0) {
      selector.addValue(remaining[0]);
    }
  };

  const removeChip = () => {
    if (selector.selectedValues.length > 0) {
      selector.removeValue(selected[0]);
    }
  };
  return {
    numSelected: selected.length,
    numRemaining: remaining.length,
    moreAllowed: selector.moreValuesAllowed,
    addChip,
    removeChip,
  };
}

/******************************************************************************
 * ### ChipSelectMenu
 *
 * Chip selection is not done on a chip-by-chip basis.
 ******************************************************************************/
export const ChipSelectMenu = (props: {
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
