import { Button } from "@client/components";
import type { Size } from "@client/components/types";
import { useCallback, useMemo } from "react";
import type { ChipDigest, SelectorProps } from "../types";
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

const ChipCounter = (props: {
  size: Size;
  baseCount: number;
  selectedCount: number;
}) => {
  return (
    <>
      <Chip count={props.baseCount} size={props.size} />
      {props.selectedCount > 0 && (
        <>
          <div className="game-arrow"></div>
          <Chip selected count={props.selectedCount} size={props.size} />
        </>
      )}
    </>
  );
};

/******************************************************************************
 * ### ChipArea
 ******************************************************************************/
export const ChipArea = (props: { children?: React.ReactNode }) => {
  return <div className="game-chip-area">{props.children}</div>;
};

/******************************************************************************
 * ### ChipAreaLabel
 ******************************************************************************/
export const ChipAreaLabel = (props: { children?: React.ReactNode }) => {
  return <div className="game-chip-area__label">{props.children}</div>;
};

/******************************************************************************
 * ### ChipDisplay
 ******************************************************************************/
export const ChipDisplay = (props: {
  fullWidth?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = ["game-chip-display"];
  if (props.fullWidth) classNames.push("game-chip-display--fullwidth");
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### ChipDisplayCounter
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
 ******************************************************************************/
export const ChipDisplaySelector = (props: {
  size: Size;
  numSelected: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSubmit?: () => void;
  disableIncrement?: boolean;
  disableSubmit?: boolean;
}) => {
  return (
    <div className="game-chip-display__selector">
      <Button
        rounded
        border="dark"
        color="chip"
        size={props.size}
        disabled={props.numSelected < 1}
        onClick={props.onDecrement}
      >
        -
      </Button>
      <Button
        rounded
        border="dark"
        color="chip"
        size={props.size}
        disabled={!!props.disableIncrement}
        onClick={props.onIncrement}
      >
        +
      </Button>
      {props.onSubmit && (
        <Button
          rounded
          border="dark"
          color="chip"
          size={props.size}
          disabled={!!props.disableSubmit}
          onClick={props.onSubmit}
        >
          ok
        </Button>
      )}
    </div>
  );
};

/******************************************************************************
 * ### ChipCounterBadge
 *
 * A zero-height container used for positioning chip counters on the edge
 * of other elements.
 ******************************************************************************/
export const ChipCounterBadge = (props: { children: React.ReactNode }) => {
  return (
    <div className="game-chip-edge">
      <div className="game-chip-edge__x">{props.children}</div>
    </div>
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
