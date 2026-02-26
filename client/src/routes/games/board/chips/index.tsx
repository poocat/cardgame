import { ButtonBase } from "@client/components";
import { Edge } from "@client/components/layout";
import type { Size } from "@client/components/types";
import { useCallback, useMemo } from "react";
import type { ChipDigest, PlayerSide, SelectorProps } from "../types";
import "./styles.css";

/******************************************************************************
 * ### Chip
 *
 * Basic chip icon, with a number inside of it.
 ******************************************************************************/
const Chip = (props: { count: number; size: Size; selected?: boolean }) => {
  const classNames = ["game-chip", `game-chip--size-${props.size}`];
  if (props.selected) classNames.push("game-chip--selected");
  const className = classNames.join(" ");
  return <div className={className}>{props.count}</div>;
};

/******************************************************************************
 * ### ChipCounter
 *
 * A stack of chip icons that indicates how many chips have been selected
 * from a given pool, if any.
 ******************************************************************************/
const ChipCounter = (props: {
  size: Size;
  baseCount: number;
  selectedCount: number;
}) => {
  /**
   * TODO!!! Add a `prevSelectedCount` to account for multi-choice activities
   * where chips are selected from the same pool.
   */
  return (
    <>
      <Chip count={props.baseCount} size={props.size} />
      {props.selectedCount > 0 && (
        <>
          <div className={`game-arrow game-arrow--size-${props.size}`}></div>
          <Chip selected count={props.selectedCount} size={props.size} />
        </>
      )}
    </>
  );
};

/******************************************************************************
 * ### ChipArea
 *
 * A container with a border used to display a named chip pool (e.g. "reserve").
 ******************************************************************************/
export const ChipArea = (props: {
  inverted: boolean;
  side: PlayerSide;
  children?: React.ReactNode;
}) => {
  const classNames = ["game-chip-area", `game-chip-area--side-${props.side}`];
  if (props.inverted) classNames.push("game-chip-area--inverted");
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### ChipAreaLabel
 *
 * A wrapper around the text used to name the chip pool.
 ******************************************************************************/
export const ChipAreaLabel = (props: { children?: React.ReactNode }) => {
  return <div className="game-chip-area__label">{props.children}</div>;
};

/******************************************************************************
 * ### ChipDisplay
 *
 * A generic container used to display a chip pool, as well as any selected
 * chips, and any menus for selecting chips. Fills the container it is in.
 * Can be used as a child of `<ChipArea/>`, or elsewhere.
 ******************************************************************************/
export const ChipDisplay = (props: {
  side: PlayerSide;
  inverted: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = [
    "game-chip-display",
    `game-chip-display--side-${props.side}`,
  ];
  if (props.inverted) classNames.push(`game-chip-display--inverted`);
  if (props.fullWidth) classNames.push("game-chip-display--fullwidth");
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### ChipDisplayCounter
 *
 * Displays a chip pool, as well as any selected chips from the pool. Should
 * be a child of `<ChipDisplay/>`.
 ******************************************************************************/
export const ChipDisplayCounter = (props: {
  size: Size;
  baseCount: number;
  selectedCount: number;
}) => {
  return (
    <div className="game-chip-display__counter">
      <ChipCounter {...props} />
    </div>
  );
};

/******************************************************************************
 * ### ChipDisplaySelector
 *
 * A stack of buttons to increment, decrement, and confirm the number of chips
 * selected from the corresponding chip pool. Should be a child of
 * `<ChipDisplay/>`.
 ******************************************************************************/
export const ChipDisplaySelector = (props: {
  size: Size;
  numSelected: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSubmit: () => void;
  disableIncrement?: boolean;
  disableSubmit?: boolean;
}) => {
  return (
    <div className="game-chip-display__selector">
      <ButtonBase disabled={props.numSelected < 1} onClick={props.onDecrement}>
        <div className={`game-chip game-chip--size-${props.size}`}>-</div>
      </ButtonBase>
      <ButtonBase
        disabled={!!props.disableIncrement}
        onClick={props.onIncrement}
      >
        <div className={`game-chip game-chip--size-${props.size}`}>+</div>
      </ButtonBase>
      <ButtonBase disabled={!!props.disableSubmit} onClick={props.onSubmit}>
        <div className={`game-chip game-chip--size-${props.size}`}>ok</div>
      </ButtonBase>
    </div>
  );
};

/******************************************************************************
 * ### ChipCounterEdge
 *
 * A zero-height container used for positioning chip counters on the bottom
 * edges of other elements.
 *
 * Note, if siblings have non-zero bottom margin, the position will be offset
 * from the edge.
 ******************************************************************************/
export const ChipCounterEdge = (props: { children: React.ReactNode }) => {
  return (
    <Edge>
      <div className="game-chip-edge">{props.children}</div>
    </Edge>
  );
};

/******************************************************************************
 * ### useChipSelector
 *
 * State management for components that let the player select chips from a given
 * pool.
 ******************************************************************************/
export function useChipSelector(args: {
  chips: ChipDigest[];
  selectorProps: SelectorProps | null;
}): {
  numSelected: number;
  numRemaining: number;
  addChip: () => void;
  removeChip: () => void;
} {
  const chipIds = args.chips.map((c) => c.id);
  const selectedValues = args.selectorProps?.selectedValues ?? [];
  const selected = selectedValues.filter((v) => chipIds.includes(v));
  const remaining = chipIds.filter((chipId) => !selected.includes(chipId));

  const addChip = useCallback(() => {
    if (args.selectorProps?.moreValuesAllowed && remaining.length > 0) {
      args.selectorProps?.addValue(remaining[0]);
    }
  }, [
    args.selectorProps?.addValue,
    args.selectorProps?.moreValuesAllowed,
    remaining,
  ]);

  const removeChip = useCallback(() => {
    if (selectedValues.length > 0) {
      args.selectorProps?.removeValue(selected[0]);
    }
  }, [args.selectorProps?.removeValue, selectedValues.length, selected]);

  return useMemo(
    () => ({
      numSelected: selected.length,
      numRemaining: remaining.length,
      addChip,
      removeChip,
    }),
    [addChip, removeChip, remaining, selected],
  );
}
