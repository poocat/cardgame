import type { gameDigestSchema } from "@common/api/digests";
import type { choiceTypes } from "@common/game/enums";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type z from "zod";
import type { FaceUpCardDigest } from "./types";

type GameDigest = z.infer<typeof gameDigestSchema>;

////////////////////////////////////////////////////////////////////////////////
// Choice Context
////////////////////////////////////////////////////////////////////////////////
type ChoiceType = (typeof choiceTypes)[number];

type ChoiceContextType = {
  choiceType: ChoiceType | null;
  minValues: number;
  maxValues: number | null;
  forObserver: boolean;
  /** Will indicate if the value is part of the current choice. */
  checkValue: (value: string) => boolean;
  /** Will indicate whether the given card is associated with any chips or actions that are part of the current choice. */
  checkCard: (cardId: string) => boolean;
  /** Will indicate whether the value was chosen as part of a previous choice, earlier in the current activity. */
  checkPreviousValue: (value: string) => boolean;
};

const dummyChoicesContext = {
  choiceType: null,
  minValues: 0,
  maxValues: 0,
  forObserver: false,
  checkValue: () => false,
  checkCard: () => false,
  checkPreviousValue: () => false,
} as const satisfies ChoiceContextType;

export const ChoiceContext =
  createContext<ChoiceContextType>(dummyChoicesContext);

export function useChoice() {
  return useContext(ChoiceContext);
}

/******************************************************************************
 * ### useChoiceContext
 *
 * Use to create the object passed to the `SelectorContext` provider.
 ******************************************************************************/
export function useChoiceContext(game?: GameDigest): ChoiceContextType {
  const observerId = game?.observingPlayer?.id;
  const choosingPlayerId = game?.activity.choice.choosingPlayerId;
  const forObserver =
    observerId !== undefined &&
    choosingPlayerId !== undefined &&
    observerId === choosingPlayerId;
  const choiceType = game?.activity.choice.type ?? null;
  const minValues = game?.activity.choice.min ?? 0;
  const maxValues = game?.activity.choice.max ?? null;

  const checkValue = useCallback(
    (value: string) => {
      return (
        game?.activity.choice.values.some((v) => v.value === value) ?? false
      );
    },
    [game],
  );

  const checkCard = useCallback(
    (cardId: string) => {
      return (
        game?.activity.choice.values.some(
          ({ onCardId }) => onCardId === cardId,
        ) ?? false
      );
    },
    [game],
  );

  const checkPreviousValue = useCallback(() => {
    // TODO!!!
    return false;
  }, []);

  // Memoize the result to avoid excessive re-renders of all its consumers.
  return useMemo(
    () => ({
      choiceType,
      minValues,
      maxValues,
      forObserver,
      checkValue,
      checkCard,
      checkPreviousValue,
    }),
    [
      choiceType,
      minValues,
      maxValues,
      forObserver,
      checkValue,
      checkCard,
      checkPreviousValue,
    ],
  );
}

////////////////////////////////////////////////////////////////////////////////
// Selector Context
////////////////////////////////////////////////////////////////////////////////
type SelectorContextType = {
  selectedValues: string[];
  moreValuesNeeded: boolean;
  moreValuesAllowed: boolean;
  checkValueSelected: (value: string) => boolean;
  addValue: (value: string) => void;
  removeValue: (value: string) => void;
  clearValues: () => void;
};

const dummySelectorContext = {
  selectedValues: [],
  moreValuesNeeded: false,
  moreValuesAllowed: false,
  checkValueSelected: () => false,
  addValue: () => {},
  removeValue: () => {},
  clearValues: () => {},
} as const satisfies SelectorContextType;

export const SelectorContext =
  createContext<SelectorContextType>(dummySelectorContext);

export function useSelector() {
  return useContext(SelectorContext);
}

/******************************************************************************
 * ### useSelectorContext
 *
 * Use to create the object passed to the `SelectorContext` provider.
 ******************************************************************************/
export function useSelectorContext(game?: GameDigest): SelectorContextType {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const minValuesNeeded = game?.activity.choice?.min ?? 0;
  const moreValuesNeeded = selectedValues.length < minValuesNeeded;
  const maxValuesAllowed = game?.activity.choice?.max ?? 0;
  const moreValuesAllowed = selectedValues.length < maxValuesAllowed;

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

  const clearValues = useCallback(() => setSelectedValues([]), []);

  return useMemo(
    () => ({
      selectedValues,
      moreValuesNeeded,
      moreValuesAllowed,
      checkValueSelected,
      addValue,
      removeValue,
      clearValues,
    }),
    [
      selectedValues,
      moreValuesNeeded,
      moreValuesAllowed,
      checkValueSelected,
      addValue,
      removeValue,
      clearValues,
    ],
  );
}

/******************************************************************************
 * ### useValueSelect
 *
 * Uses the "selector" and "choice" contexts to create the properties necessary
 * to implement a checkbox-style select component.
 ******************************************************************************/
export function useValueSelect(value: string) {
  const choice = useChoice();
  const selector = useSelector();

  const selectable = choice.checkValue(value);
  const selected = selector.checkValueSelected(value);

  const disabled = useMemo(() => {
    if (!selectable) return true;
    if (selected) return false;
    return !selector.moreValuesAllowed;
  }, [selectable, selected, selector.moreValuesAllowed]);

  const toggle = useCallback(() => {
    if (selected) {
      selector.removeValue(value);
    } else {
      selector.addValue(value);
    }
  }, [selected, value, selector.addValue, selector.removeValue]);

  return useMemo(
    () => ({
      selected,
      disabled,
      selectable,
      toggle,
    }),
    [selected, disabled, selectable, toggle],
  );
}

////////////////////////////////////////////////////////////////////////////////
// Dialog Context
////////////////////////////////////////////////////////////////////////////////

type DialogValue =
  | {
      type: "card";
      card: FaceUpCardDigest;
    }
  | {
      type: "arbitrary";
      values: string[];
    };

type DialogContextType = {
  value: DialogValue | null;
  isOpen: boolean;
  close: () => void;
  set: (value: DialogValue) => void;
};

const dummyDialogContext = {
  value: null,
  isOpen: false,
  close: () => {},
  set: () => {},
};

export const DialogContext =
  createContext<DialogContextType>(dummyDialogContext);

export function useDialog() {
  return useContext(DialogContext);
}

/******************************************************************************
 * ### useDialogContext
 *
 * Use to create the object passed to the `DialogContext` provider.
 *
 * A single state is used to switch a pop-up dialog on/off. For instance to
 * show the details of a face up card.
 ******************************************************************************/
export function useDialogContext(): DialogContextType {
  const [value, setValue] = useState<DialogValue | null>(null);

  const isOpen = useMemo(() => value !== null, [value]);
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

////////////////////////////////////////////////////////////////////////////////
// Submission Context
////////////////////////////////////////////////////////////////////////////////

type SubmitContextType = {
  submit: () => Promise<void>;
  canSubmit: boolean;
};

const dummySubmitContext = {
  submit: async () => {},
  canSubmit: false,
};

export const SubmitContext =
  createContext<SubmitContextType>(dummySubmitContext);

export function useSubmit() {
  return useContext(SubmitContext);
}
