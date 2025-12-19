import type {
  chipDigestSchema,
  choiceValueDigestSchema,
  gameDigestSchema,
  inPlayCardDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import type { choiceTypes } from "@common/game/enums";
import type z from "zod";

////////////////////////////////////////////////////////////////////////////////
// Digests
////////////////////////////////////////////////////////////////////////////////
export type InPlayCardDigest = z.infer<typeof inPlayCardDigestSchema>;
export type VisibleCardDigest = z.infer<typeof visibleCardDigestSchema>;
export type FaceUpCardDigest = VisibleCardDigest & Partial<InPlayCardDigest>;
export type GameDigest = z.infer<typeof gameDigestSchema>;
export type ChoiceValueDigest = z.infer<typeof choiceValueDigestSchema>;
export type ChipDigest = z.infer<typeof chipDigestSchema>;

////////////////////////////////////////////////////////////////////////////////
// Choice
////////////////////////////////////////////////////////////////////////////////

export type ChoiceType = (typeof choiceTypes)[number];

export type ChoiceProps = {
  choiceType: ChoiceType | null;
  minValues: number;
  maxValues: number | null;
  /** Will get the values that are associated with the given card. */
  getValuesOnCard: (cardId: string) => string[];
  /** Will indicate if there are any chips or actions on the given card that are part of the current choice. */
  checkValueOnCard: (cardId: string) => boolean;
  /** Will indicate if the value is part of the current choice. */
  checkValue: (value: string) => boolean;
  /** Will indicate whether the value was chosen as part of a previous choice, earlier in the current activity. */
  checkPreviousValue: (value: string) => boolean;
};

////////////////////////////////////////////////////////////////////////////////
// Selector
////////////////////////////////////////////////////////////////////////////////
export type SelectorProps = {
  /** Not stable. Reference changes every time a value is added or removed. */
  selectedValues: string[];
  /** Not stable, but the value doesn't necessarily change every time a value is added or removed. */
  moreValuesNeeded: boolean;
  /** Not stable, but the value doesn't necessarily change every time a value is added or removed. */
  moreValuesAllowed: boolean;
  /** Not stable. Reference changes every time a value is added or removed. */
  checkValueSelected: (value: string) => boolean;
  /** Stable. */
  addValue: (value: string) => void;
  /** Stable. */
  removeValue: (value: string) => void;
  /** Not stable. Reference changes every time a value is added or removed. */
  toggleValue: (value: string) => void;
  /** Stable. */
  clearValues: () => void;
};

////////////////////////////////////////////////////////////////////////////////
// Dialog
////////////////////////////////////////////////////////////////////////////////
export type DialogValue =
  | {
      type: "card";
      card: FaceUpCardDigest;
    }
  | {
      type: "arbitrary";
      values: string[];
    };

export type DialogProps = {
  value: DialogValue | null;
  isOpen: boolean;
  /** Stable. */
  close: () => void;
  /** Stable. */
  set: (value: DialogValue) => void;
};
