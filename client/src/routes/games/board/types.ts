import type {
  CardDefDigest,
  CardType,
  ChipDigest,
  FaceUpCardDigest,
  InPlayCardDigest,
  VisibleCardDigest,
} from "@client/features/cards/types";
import type { Message } from "@client/utils/messages";
import type {
  choiceValueDigestSchema,
  gameDigestSchema,
  observingPlayerDigestSchema,
  otherPlayerDigestSchema,
} from "@common/api/digests";
import type { choiceTypes } from "@common/game/enums";
import type z from "zod";

////////////////////////////////////////////////////////////////////////////////
// Digests
////////////////////////////////////////////////////////////////////////////////

// Card-shaped types are defined with the card components, since they are not
// specific to a game. Re-exported here for convenience within the board.
export type {
  CardDefDigest,
  CardType,
  ChipDigest,
  FaceUpCardDigest,
  InPlayCardDigest,
  Message,
  VisibleCardDigest,
};

export type GameDigest = z.infer<typeof gameDigestSchema>;
export type ChoiceValueDigest = z.infer<typeof choiceValueDigestSchema>;
export type ObserverPlayerDigest = z.infer<typeof observingPlayerDigestSchema>;
export type OtherPlayerDigest = z.infer<typeof otherPlayerDigestSchema>;

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

////////////////////////////////////////////////////////////////////////////////
// Layout
////////////////////////////////////////////////////////////////////////////////
export type PlayerSide = "left" | "right";
