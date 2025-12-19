import type { gameDigestSchema } from "@common/api/digests";
import { useCallback, useMemo } from "react";
import type z from "zod";
import type { ChoiceProps } from "./types";

type GameDigest = z.infer<typeof gameDigestSchema>;

/******************************************************************************
 * ### useChoice
 *
 * A utility for examining the current choice.
 ******************************************************************************/
export function useChoice(activity?: GameDigest["activity"]): ChoiceProps {
  const choice = activity?.choice;
  const choiceType = choice?.type ?? null;
  const minValues = choice?.min ?? 0;
  const maxValues = choice?.max ?? null;

  const getValuesOnCard = useCallback(
    (cardId: string) => {
      return (
        choice?.values
          .filter((v) => v.onCardId === cardId)
          .map((v) => v.value) ?? []
      );
    },
    [choice],
  );

  const checkValue = useCallback(
    (value: string) => {
      return choice?.values.some((v) => v.value === value) ?? false;
    },
    [choice],
  );

  const checkValueOnCard = useCallback(
    (cardId: string) => {
      return (
        choice?.values.some(({ onCardId }) => onCardId === cardId) ?? false
      );
    },
    [choice],
  );

  const checkPreviousValue = useCallback(
    (value: string) => {
      const vals = activity?.previouslyChosenValues ?? [];
      return vals.includes(value);
    },
    [activity?.previouslyChosenValues],
  );

  return useMemo(
    () => ({
      choiceType,
      minValues,
      maxValues,
      getValuesOnCard,
      checkValue,
      checkValueOnCard,
      checkPreviousValue,
    }),
    [
      choiceType,
      minValues,
      maxValues,
      getValuesOnCard,
      checkValue,
      checkValueOnCard,
      checkPreviousValue,
    ],
  );
}
