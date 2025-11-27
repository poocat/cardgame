import type { gameDigestSchema } from "@common/api/digests";
import type { choiceTypes } from "@common/game/enums";
import { createContext, useCallback, useContext, useState } from "react";
import type z from "zod";

type GameDigest = z.infer<typeof gameDigestSchema>;
type ChoiceType = (typeof choiceTypes)[number];

////////////////////////////////////////////////////////////////////////////////
// Choice Context
////////////////////////////////////////////////////////////////////////////////
type ChoiceContextType = {
  choiceType: ChoiceType | null;
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

export function useChoiceContext(game?: GameDigest): ChoiceContextType {
  const observerId = game?.observingPlayer?.id;
  const choosingPlayerId = game?.activity.choice.choosingPlayerId;
  const forObserver =
    observerId !== undefined &&
    choosingPlayerId !== undefined &&
    observerId === choosingPlayerId;
  const choiceType = game?.activity.choice.type ?? null;

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

  return {
    choiceType,
    forObserver,
    checkValue,
    checkCard,
    checkPreviousValue,
  };
}

////////////////////////////////////////////////////////////////////////////////
// Selector Context
////////////////////////////////////////////////////////////////////////////////
type SelectorHandlers = {
  checkValue: () => boolean;
  addValue: () => void;
  removeValue: () => void;
};

type SelectorContextType = {
  chosen: string[];
  moreValuesNeeded: boolean;
  moreValuesAllowed: boolean;
  clear: () => void;
  handlers: (value: string) => SelectorHandlers;
};

const dummySelectorContext = {
  chosen: [],
  moreValuesNeeded: false,
  moreValuesAllowed: false,
  clear: () => {},
  handlers: () => ({
    checkValue: () => false,
    addValue: () => {},
    removeValue: () => {},
  }),
} as const satisfies SelectorContextType;

export const SelectorContext =
  createContext<SelectorContextType>(dummySelectorContext);

export function useSelector() {
  return useContext(SelectorContext);
}

export function useSelectorContext(game?: GameDigest): SelectorContextType {
  const [chosen, setChosen] = useState<string[]>([]);

  const minValuesNeeded = game?.activity.choice?.min ?? 0;
  const moreValuesNeeded = chosen.length < minValuesNeeded;
  const maxValuesAllowed = game?.activity.choice?.max ?? 0;
  const moreValuesAllowed = chosen.length < maxValuesAllowed;

  const checkValue = useCallback(
    (value: string) => {
      return chosen.includes(value);
    },
    [chosen],
  );

  const addValue = useCallback((value: string) => {
    setChosen((current) => [...current, value]);
  }, []);

  const removeValue = useCallback((value: string) => {
    setChosen((current) => {
      const next = [...current];
      const idx = next.indexOf(value);
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const clear = useCallback(() => setChosen([]), []);

  const handlers = useCallback(
    (value: string) => {
      return {
        checkValue: () => checkValue(value),
        addValue: () => addValue(value),
        removeValue: () => removeValue(value),
      };
    },
    [checkValue, addValue, removeValue],
  );

  return {
    chosen,
    moreValuesNeeded,
    moreValuesAllowed,
    clear,
    handlers,
  };
}
