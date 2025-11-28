import { useCallback, useMemo, useState } from "react";

type DialogHook<T extends {}> = {
  value: T | null;
  isOpen: boolean;
  close: () => void;
  set: (value: T) => void;
};

export function useDialog<T extends {}>(): DialogHook<T> {
  const [value, setValue] = useState<T | null>(null);

  const isOpen = useMemo(() => value !== null, [value]);
  const close = useCallback(() => setValue(null), []);
  const set = useCallback((value: T) => setValue(value), []);

  return {
    value,
    isOpen,
    close,
    set,
  };
}
