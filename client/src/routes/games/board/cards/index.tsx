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

import { Button } from "@client/components";
import type {
  inPlayCardDigestSchema,
  visibleCardDigestSchema,
} from "@common/api/digests";
import { useMemo } from "react";
import type z from "zod";
import {
  ChipCounterBadge,
  ChipSelectMenu,
  DetailChipCounter,
  ThumbnailChipCounter,
  useChipSelector,
} from "../chips";
import { colors } from "../colors";
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
  CardDetailActionContainer,
  CardDetailContainer,
  CardDetailFooterContainer,
} from "./detail";
import {
  CardThumbnailBodyContainer,
  CardThumbnailContainer,
  CardThumbnailFaceUp,
  CardThumbnailHeader,
  CardThumbnailHeaderContainer,
  CardThumbnailHighlight,
} from "./thumbnail";
import type { ThumbnailCardHighlightVariant } from "./types";

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
 *
 * TODO!!! Memoize?
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
  const cardHasChoosableValue = choice.getValuesOnCard(cardId).length > 0;
  const cardIsChoosableValue = choice.checkValue(cardId);
  const cardWasChosenPreviously = choice.checkPreviousValue(cardId);

  const selector = useSelector();
  const cardSelected = selector.checkValueSelected(cardId);

  const chipIds = props.card.chips.map(({ id }) => id);
  const { numSelected: numSelectedChips } = useChipSelector({ chipIds });

  const select = useValueSelect(cardId);
  const cardSelectable = !select.disabled;

  const dialog = useDialog();

  const handleClick = () => {
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
          return "observerCanChooseActionOnCard";
        if (choiceType === "chipId" && cardHasChoosableValue)
          return "observerCanChooseChipOnCard";
        if (choiceType === "cardId" && cardSelected)
          return "observerHasChosenCard";
        if (choiceType === "cardId" && cardIsChoosableValue)
          return "observerCanChooseCard";
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
    cardSelected,
    cardHasChoosableValue,
    cardIsChoosableValue,
    cardWasChosenPreviously,
  ]);

  return (
    <CardThumbnailContainer>
      <CardThumbnailHighlight variant={variant}>
        <CardThumbnailHeaderContainer>
          <CardThumbnailHeader
            cardId={props.card.id}
            cardName={props.card.name}
            cardSelectable={cardSelectable}
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
          {props.card.chips.length > 0 && (
            <ChipCounterBadge>
              <ThumbnailChipCounter
                count={chipIds.length}
                numSelected={numSelectedChips}
              />
            </ChipCounterBadge>
          )}
        </CardThumbnailBodyContainer>
      </CardThumbnailHighlight>
    </CardThumbnailContainer>
  );
};

////////////////////////////////////////////////////////////////////////////////
// Details Form Factor
////////////////////////////////////////////////////////////////////////////////

// TODO!!! Memoize?
const DetailCardAction = (props: {
  disabled: boolean;
  actionType: string;
  actionId: string;
  instructions: string;
}) => {
  const { selected, disabled, toggle } = useValueSelect(props.actionId);

  return (
    <CardDetailAction
      label={`[${props.actionType}] ${props.instructions}`}
      selected={selected}
      disabled={disabled || props.disabled}
      onChange={toggle}
    />
  );
};

/******************************************************************************
 * ### DetailCardChipSelect
 ******************************************************************************/
const DetailCardChipSelect = (props: { chipIds: string[] }) => {
  const { numSelected, moreAllowed, addChip, removeChip } = useChipSelector({
    chipIds: props.chipIds,
  });

  const { submit, canSubmit } = useSubmit();

  return (
    <ChipSelectMenu
      numSelected={numSelected}
      disableIncrement={!moreAllowed}
      onIncrement={addChip}
      onDecrement={removeChip}
      onSubmit={submit}
      disableSubmit={!canSubmit}
    />
  );
};

/******************************************************************************
 * ### DetailCard
 *
 * Complete composition of a card in the detail form-factor.
 ******************************************************************************/
export const DetailCard = (props: { card: FaceUpCardDigest }) => {
  const choice = useChoice();
  const selector = useSelector();
  const dialog = useDialog();
  const { submit, canSubmit } = useSubmit();

  const valuesOnCard = choice.getValuesOnCard(props.card.id);
  const selectedValuesOnCard = valuesOnCard.filter((v) =>
    selector.checkValueSelected(v),
  );

  const cardHasChoice = valuesOnCard.length > 0 && choice.forObserver;
  const cardHasSelectableActions =
    cardHasChoice && choice.choiceType === "actionId";
  const cardHasSelectableChips =
    cardHasChoice && choice.choiceType === "chipId";

  const chipIds = props.card.chips.map(({ id }) => id);
  const { numSelected: numSelectedChips } = useChipSelector({ chipIds });

  // Disable the submit button if nothing from this card was selected.
  const submitDisabled = !canSubmit || selectedValuesOnCard.length < 1;

  const handleSubmit = () => {
    submit();
    dialog.close();
  };

  return (
    <CardDetailContainer>
      <CardDetail>
        <div>{props.card.name}</div>
        <CardDetailActionContainer>
          {props.card.actions.map((action) => (
            <DetailCardAction
              key={action.id}
              actionId={action.id}
              actionType={action.type}
              instructions={action.instructions}
              disabled={!cardHasSelectableActions}
            />
          ))}
        </CardDetailActionContainer>
      </CardDetail>
      {chipIds.length > 0 && (
        <ChipCounterBadge>
          <DetailChipCounter
            count={chipIds.length}
            numSelected={numSelectedChips}
          />
        </ChipCounterBadge>
      )}
      {cardHasChoice && (
        <CardDetailFooterContainer>
          {cardHasSelectableChips && <DetailCardChipSelect chipIds={chipIds} />}
          {cardHasSelectableActions && !submitDisabled && (
            <Button
              onClick={handleSubmit}
              color={colors.actions.scale(0.8)}
              height={50}
              fontSize={20}
            >
              ✓
            </Button>
          )}
        </CardDetailFooterContainer>
      )}
    </CardDetailContainer>
  );
};
