import { useCallback, useMemo, useState } from "react";
import type { DialogProps, DialogValue } from "./types";

/******************************************************************************
 * ### useDialog
 *
 * State management for a pop-up dialog used for showing the details of a card.
 ******************************************************************************/
export function useDialog(): DialogProps {
  const [value, setValue] = useState<DialogValue | null>(null);

  const isOpen = value !== null;
  const close = useCallback(() => setValue(null), []);
  const set = useCallback((value: DialogValue) => setValue(value), []);

  return useMemo(
    () => ({
      value,
      isOpen,
      close,
      set,
    }),
    [value, isOpen, close, set],
  );
}
