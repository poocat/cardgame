import { useCallback, useMemo, useState } from "react";
import type { SelectorProps } from "./types";

/******************************************************************************
 * ### useSelector
 *
 * State management for the list of values that are chosen by the current
 * choosing player.
 ******************************************************************************/
export function useSelector(args: { min: number; max: number }): SelectorProps {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const moreValuesNeeded = selectedValues.length < (args.min ?? 0);
  const moreValuesAllowed = selectedValues.length < (args.max ?? 9999);

  const checkValueSelected = useCallback(
    (value: string) => {
      return selectedValues.includes(value);
    },
    [selectedValues],
  );

  const addValue = useCallback((value: string) => {
    setSelectedValues((current) => [...current, value]);
  }, []);

  const removeValue = useCallback((value: string) => {
    setSelectedValues((current) => {
      const next = [...current];
      const idx = next.indexOf(value);
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const toggleValue = useCallback(
    (value: string) => {
      if (checkValueSelected(value)) {
        removeValue(value);
      } else {
        addValue(value);
      }
    },
    [addValue, checkValueSelected, removeValue],
  );

  const clearValues = useCallback(() => setSelectedValues([]), []);

  return useMemo(
    () => ({
      selectedValues,
      moreValuesNeeded,
      moreValuesAllowed,
      checkValueSelected,
      addValue,
      removeValue,
      toggleValue,
      clearValues,
    }),
    [
      selectedValues,
      moreValuesNeeded,
      moreValuesAllowed,
      checkValueSelected,
      addValue,
      removeValue,
      toggleValue,
      clearValues,
    ],
  );
}
