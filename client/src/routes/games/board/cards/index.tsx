/**
 * Cards
 *
 * All cards are displayed with the "thumbnail" form factor, and up to one
 * card is displayed in the "full" form factor as a pop-up dialog.
 *
 * The thumbnail should display the following information:
 * - The type of card
 * - The chips on it
 * - The set of action types available
 *
 * The thumbnail should always be presented in a container that leaves room for:
 * - The card name, above the card
 * - A checkbox (when the card is selectable) to the left of the name
 *
 * The thumbnail container will also be used to highlight the card, using
 * different colors/hues/etc for the following cases:
 * - The card is selectable (choice type is "cardId")
 * - The card has chips on it that are selectable (choice type is "chipId")
 * - The card has actions on it that are selectable (choice type is "actionId")
 *
 * (There should maybe be a specific color for each of these entities?)
 *
 * Choosing chips on a card or an action on a card requires expanding the card
 * to its "full" form factor.
 *
 * The full form factor should also be displayed in its own container, which
 * leaves room at the bottom for controls, such as:
 * - A submit button.
 * - When selecting cards, a sort of "checkbox".
 * - When selecting chips from the card, increment/decrement buttons.
 *
 * If the player has selected chips/actions from the card, if no other
 * chips/actions are selectable on any other card, then the player should not
 * be able to close the "full" view until they have submitted their choices,
 * or unselect them.
 *
 */

import type {
  inPlayCardDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import { useMemo } from "react";
import type z from "zod";
import {
  useChoice,
  useDialog,
  useSelector,
  useSubmit,
  useValueSelect,
} from "../contexts";
import type { FaceUpCardDigest } from "../types";
import {
  CardDetail,
  CardDetailAction,
  CardDetailChipSelect,
  CardDetailContainer,
  CardDetailFooterContainer,
} from "./details";
import {
  CardThumbnailBodyContainer,
  CardThumbnailContainer,
  CardThumbnailFaceUp,
  CardThumbnailHeader,
  CardThumbnailHeaderContainer,
  CardThumbnailHighlight,
} from "./thumbnails";
import type { ThumbnailCardHighlightVariant } from "./thumbnails/types";

type InPlayCardDigest = z.infer<typeof inPlayCardDigestSchema>;
type VisibleCardDigest = z.infer<typeof visibleCardDigestSchema>;

////////////////////////////////////////////////////////////////////////////////
// Thumbnail Form Factor
////////////////////////////////////////////////////////////////////////////////

/******************************************************************************
 * ### FaceUpThumbnailCard
 *
 * A complete component for displaying a card in play in the "thumbnail" form
 * factor, within its own container, which takes on different styles depending
 * on:
 * - which player is currently choosing
 * - whether or not the card or one of its actions or chips can be chosen
 * - whether or not the card or one of its actions or chips were chosen
 *   previously in the current activity
 ******************************************************************************/
export const FaceUpThumbnailCard = (
  props:
    | {
        variant: "inPlay";
        card: InPlayCardDigest;
      }
    | {
        variant: "inHand";
        card: VisibleCardDigest;
      },
) => {
  const cardId = props.card.id;
  const choice = useChoice();
  const choiceType = choice.choiceType;
  const choiceIsForObserver = choice.forObserver;
  const cardHasChoosableValue = choice.checkCard(cardId);
  const cardIsChoosableValue = choice.checkValue(cardId);
  const cardWasChosenPreviously = choice.checkPreviousValue(cardId);

  const selector = useSelector();
  const cardSelected = selector.checkValueSelected(cardId);

  const dialog = useDialog();

  const handleClick = () => {
    // TODO!!! Need better union type for visible/in play cards.
    dialog.set({ type: "card", card: props.card });
  };
  const handleSelect = () => {
    selector.addValue(cardId);
  };
  const handleDeselect = () => {
    selector.removeValue(cardId);
  };

  /**
   * Determine the variant:
   * - Check if the card (or any of its chips or actions) are part of the
   *   current choice.
   *   - If so, check if the observing player is choosing.
   *     - If so, variant is `observerChoosing_____`.
   *     - If not, variant is `otherPlayerChoosing`.
   *   - If not, check if card (or any of its chips or actions) were chosen
   *     earlier in the activity.
   *     - If so, variant is `chosenPreviously`.
   *     - If not, variant is `default`.
   */
  const variant: ThumbnailCardHighlightVariant = useMemo(() => {
    if (cardHasChoosableValue || cardIsChoosableValue) {
      if (choiceIsForObserver) {
        if (choiceType === "actionId" && cardHasChoosableValue)
          return "observerChoosingActionsOnCard";
        if (choiceType === "chipId" && cardHasChoosableValue)
          return "observerChoosingChipsOnCard";
        if (choiceType === "cardId" && cardIsChoosableValue)
          return "observerChoosingCards";
      } else {
        return "otherPlayerChoosing";
      }
    } else if (cardWasChosenPreviously) {
      return "chosenPreviously";
    }
    return "default";
  }, [
    choiceType,
    choiceIsForObserver,
    cardHasChoosableValue,
    cardIsChoosableValue,
    cardWasChosenPreviously,
  ]);

  return (
    <CardThumbnailContainer>
      <CardThumbnailHighlight variant={variant} cardSelected={cardSelected}>
        <CardThumbnailHeaderContainer>
          <CardThumbnailHeader
            cardId={props.card.id}
            cardName={props.card.name}
            cardSelectable={variant === "observerChoosingCards"}
            cardSelected={cardSelected}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
          />
        </CardThumbnailHeaderContainer>
        <CardThumbnailBodyContainer>
          <CardThumbnailFaceUp
            cardType={props.card.type}
            numChips={props.card.chips.length}
            onClick={handleClick}
          />
        </CardThumbnailBodyContainer>
      </CardThumbnailHighlight>
    </CardThumbnailContainer>
  );
};

////////////////////////////////////////////////////////////////////////////////
// Details Form Factor
////////////////////////////////////////////////////////////////////////////////

const DetailedCardAction = (props: {
  disabled: boolean;
  actionType: string;
  actionId: string;
  instructions: string;
}) => {
  const { selected, disabled, toggle } = useValueSelect(props.actionId);

  return (
    <CardDetailAction
      label={`[${props.actionType}] ${props.instructions}`}
      value={props.actionId}
      selected={selected}
      disabled={disabled || props.disabled}
      onChange={toggle}
    />
  );
};

const DetailCardChipSelect = (props: { chipIds: string[] }) => {
  const selector = useSelector();
  const selected = selector.selectedValues;
  const remaining = props.chipIds.filter(
    (chipId) => !selected.includes(chipId),
  );

  const handleAddChip = () => {
    if (selector.moreValuesAllowed && remaining.length > 0) {
      selector.addValue(remaining[0]);
    }
  };

  const handleRemoveChip = () => {
    if (selector.selectedValues.length > 0) {
      selector.removeValue(selected[0]);
    }
  };

  return (
    <CardDetailChipSelect
      numSelected={selected.length}
      numRemaining={remaining.length}
      disableIncrement={!selector.moreValuesAllowed}
      onIncrement={handleAddChip}
      onDecrement={handleRemoveChip}
    />
  );
};

/******************************************************************************
 * ### DetailedCard
 ******************************************************************************/
export const DetailedCard = (props: { card: FaceUpCardDigest }) => {
  const choice = useChoice();
  const dialog = useDialog();
  const { submit, canSubmit } = useSubmit();

  const cardHasChoice = choice.checkCard(props.card.id);
  const useSelectableActions =
    choice.choiceType === "actionId" && cardHasChoice;
  const useSelectableChips = choice.choiceType === "chipId" && cardHasChoice;
  const chipIds = props.card.chips.map(({ id }) => id);

  const submitHandler = () => {
    submit();
    dialog.close();
  };

  return (
    <CardDetailContainer>
      <CardDetail>
        <div>{props.card.name}</div>
        {props.card.actions.map((action) => (
          <DetailedCardAction
            key={action.id}
            actionId={action.id}
            actionType={action.type}
            instructions={action.instructions}
            disabled={!useSelectableActions}
          />
        ))}
      </CardDetail>
      {cardHasChoice && (
        <CardDetailFooterContainer>
          {useSelectableChips && <DetailCardChipSelect chipIds={chipIds} />}
          <div>
            <button type="button" disabled={!canSubmit} onClick={submitHandler}>
              Submit
            </button>
          </div>
        </CardDetailFooterContainer>
      )}
    </CardDetailContainer>
  );
};
