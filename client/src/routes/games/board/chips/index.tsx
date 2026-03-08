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
  if (props.selected) classNames.push("game-chip--buffer");
  const className = classNames.join(" ");
  return <div className={className}>{props.count}</div>;
};

/******************************************************************************
 * ### Arrow
 ******************************************************************************/
const Arrow = (props: { size: Size; reverse?: boolean; light?: boolean }) => {
  const classNames = ["game-arrow", `game-arrow--size-${props.size}`];
  if (props.light) classNames.push("game-arrow--light");
  if (props.reverse) classNames.push("game-arrow--reverse");
  const className = classNames.join(" ");
  return <div className={className} />;
};

/******************************************************************************
 * ### ChipCounter
 *
 * A stack of chip icons that indicates how many chips have been selected
 * from a given pool, if any.
 ******************************************************************************/
export const ChipCounter = (props: {
  size: Size;
  side: PlayerSide;
  light: boolean;
  baseCount: number;
  selectedCount: number;
}) => {
  /**
   * TODO!!! Add a `prevSelectedCount` prop to account for multi-choice
   * activities where chips are selected from the same pool.
   */
  const direction = props.side === "left" ? "forward" : "reverse";
  return (
    <div className={`game-chip-stack game-chip-stack--${direction}`}>
      <Chip count={props.baseCount} size={props.size} />
      {props.selectedCount > 0 && (
        <>
          <Arrow
            size={props.size}
            light={props.light}
            reverse={props.side === "right"}
          />
          <Chip selected count={props.selectedCount} size={props.size} />
        </>
      )}
    </div>
  );
};

/******************************************************************************
 * ### ChipPoolContainer
 *
 * A container with a border used to display a named chip pool (e.g. "reserve").
 ******************************************************************************/
export const ChipPoolContainer = (props: {
  light: boolean;
  side: PlayerSide;
  children?: React.ReactNode;
}) => {
  const classNames = ["game-chip-pool", `game-chip-pool--side-${props.side}`];
  if (props.light) classNames.push("game-chip-pool--light");
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### ChipPoolLabel
 *
 * A wrapper around the text used to name the chip pool.
 ******************************************************************************/
export const ChipPoolLabel = (props: { children?: React.ReactNode }) => {
  return <div className="game-chip-pool__label">{props.children}</div>;
};

/******************************************************************************
 * ### ChipPoolDisplay
 *
 * A container used to display a chip pool, as well as any selected chips, and
 * any menus for selecting chips.
 ******************************************************************************/
export const ChipPoolDisplay = (props: {
  side: PlayerSide;
  light: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}) => {
  const classNames = [
    "game-chip-pool__display",
    `game-chip-pool__display--side-${props.side}`,
  ];
  if (props.light) classNames.push(`game-chip-pool__display--light`);
  if (props.fullWidth) classNames.push("game-chip-pool__display--fullwidth");
  const className = classNames.join(" ");
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### ChipSelector
 *
 * A stack of buttons to increment, decrement, and confirm the number of chips
 * selected from the corresponding chip pool.
 ******************************************************************************/
export const ChipSelector = (props: {
  size: Size;
  light: boolean;
  numSelected: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSubmit?: () => void;
  disableIncrement?: boolean;
  disableSubmit?: boolean;
}) => {
  return (
    <div className={`game-chip-stack game-chip-stack--forward`}>
      <ButtonBase disabled={props.numSelected < 1} onClick={props.onDecrement}>
        <div className={`game-chip game-chip--size-${props.size}`}>-</div>
      </ButtonBase>
      <ButtonBase
        disabled={!!props.disableIncrement}
        onClick={props.onIncrement}
      >
        <div className={`game-chip game-chip--size-${props.size}`}>+</div>
      </ButtonBase>
      {props.onSubmit && (
        <>
          <Arrow size={props.size} light={props.light} />
          <ButtonBase disabled={!!props.disableSubmit} onClick={props.onSubmit}>
            <div className={`game-chip game-chip--size-${props.size}`}>ok</div>
          </ButtonBase>
        </>
      )}
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
export const ChipCounterEdge = (props: {
  size: Size;
  children: React.ReactNode;
}) => {
  return (
    <Edge variant="horizontal-start">
      <div className={`game-chip-edge game-chip-edge--size-${props.size}`}>
        {props.children}
      </div>
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
    if (selected.length > 0) {
      args.selectorProps?.removeValue(selected[0]);
    }
  }, [args.selectorProps?.removeValue, selected]);

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
