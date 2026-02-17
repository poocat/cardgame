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
import { memo, useCallback, useMemo } from "react";
import {
  ChipCounterBadge,
  ChipDisplay,
  ChipDisplayCounter,
  ChipDisplaySelector,
  useChipSelector,
} from "../chips";
import type {
  ChipDigest,
  ChoiceProps,
  DialogProps,
  FaceUpCardDigest,
  InPlayCardDigest,
  SelectorProps,
  VisibleCardDigest,
} from "../types";
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
export const FaceUpThumbnailCard = memo(
  (
    props: {
      setDialog: DialogProps["set"];
      choiceProps: ChoiceProps;
      /** Set to null when the observing player isn't choosing, or the card has no selectable values on it. */
      selectorProps: SelectorProps | null;
    } & (
      | {
          variant: "inPlay";
          card: InPlayCardDigest;
        }
      | {
          variant: "inHand";
          card: VisibleCardDigest;
        }
    ),
  ) => {
    const cardId = props.card.id;
    const choiceType = props.choiceProps.choiceType;
    const selectDisabled = props.selectorProps === null;
    const cardHasChoosableValue = props.choiceProps.checkValueOnCard(cardId);
    const cardIsChoosableValue = props.choiceProps.checkValue(cardId);
    const cardWasChosenPreviously =
      props.choiceProps.checkPreviousValue(cardId);

    const cardSelected =
      props.selectorProps?.checkValueSelected(cardId) ?? false;

    const chipIds = props.card.chips.map(({ id }) => id);
    const selectedChipIds =
      props.selectorProps?.selectedValues.filter((v) => chipIds.includes(v)) ??
      [];

    const expand = useCallback(() => {
      props.setDialog({ type: "card", card: props.card });
    }, [props.card, props.setDialog]);

    const toggleCardSelect = useCallback(() => {
      props.selectorProps?.toggleValue(cardId);
    }, [cardId, props.selectorProps?.toggleValue]);

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
        if (!selectDisabled) {
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
      selectDisabled,
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
              cardSelected={cardSelected}
              selectDisabled={!cardIsChoosableValue || selectDisabled}
              onChange={toggleCardSelect}
            />
          </CardThumbnailHeaderContainer>
          <CardThumbnailBodyContainer>
            <CardThumbnailFaceUp
              cardType={props.card.type}
              numChips={props.card.chips.length}
              exhausted={
                props.variant === "inPlay" ? props.card.exhausted : false
              }
              onClick={expand}
            />
            {props.card.chips.length > 0 && (
              <ChipCounterBadge>
                <ChipDisplay fullWidth={true}>
                  <ChipDisplayCounter
                    size="sm"
                    baseCount={chipIds.length}
                    selectedCount={selectedChipIds.length}
                  />
                </ChipDisplay>
              </ChipCounterBadge>
            )}
          </CardThumbnailBodyContainer>
        </CardThumbnailHighlight>
      </CardThumbnailContainer>
    );
  },
);

////////////////////////////////////////////////////////////////////////////////
// Details Form Factor
////////////////////////////////////////////////////////////////////////////////

const DetailCardAction = (props: {
  selected: boolean;
  disabled: boolean;
  actionType: string;
  actionId: string;
  instructions: string;
  onChange: () => void;
}) => {
  return (
    <CardDetailAction
      label={`[${props.actionType}] ${props.instructions}`}
      selected={props.selected}
      disabled={props.disabled}
      onChange={props.onChange}
    />
  );
};

/******************************************************************************
 * ### DetailCardChipSelect
 ******************************************************************************/
const DetailCardChipSelect = (props: {
  chips: ChipDigest[];
  onSubmitChoice: () => void;
  submitDisabled: boolean;
  selectorProps: SelectorProps | null;
}) => {
  const { numSelected, addChip, removeChip } = useChipSelector({
    chips: props.chips,
    selectorProps: props.selectorProps,
  });

  return (
    <ChipDisplaySelector
      size="md"
      numSelected={numSelected}
      disableIncrement={!props.selectorProps?.moreValuesAllowed}
      onIncrement={addChip}
      onDecrement={removeChip}
      onSubmit={props.onSubmitChoice}
      disableSubmit={props.submitDisabled}
    />
  );
};

/******************************************************************************
 * ### DetailCard
 *
 * Complete composition of a card in the detail form-factor.
 ******************************************************************************/
export const DetailCard = (props: {
  card: FaceUpCardDigest;
  onSubmitChoice: () => void;
  submitDisabled: boolean;
  choiceProps: ChoiceProps;
  selectorProps: SelectorProps | null;
}) => {
  const valuesOnCard = props.choiceProps.getValuesOnCard(props.card.id);
  const selectedValues = props.selectorProps?.selectedValues ?? [];
  const selectedValuesOnCard = selectedValues.filter((v) =>
    valuesOnCard.includes(v),
  );

  const choiceType = props.choiceProps.choiceType;

  const cardHasChoice = valuesOnCard.length > 0;
  const cardHasSelectableActions = cardHasChoice && choiceType === "actionId";
  const cardHasSelectableChips = cardHasChoice && choiceType === "chipId";

  const chipIds = props.card.chips.map(({ id }) => id);
  const numSelectedChips = cardHasSelectableChips
    ? selectedValuesOnCard.length
    : 0;

  // Disable the submit button if nothing from this card was selected.
  const submitDisabled =
    props.submitDisabled || selectedValuesOnCard.length < 1;

  return (
    <CardDetailContainer>
      <CardDetail>
        <div>{props.card.name}</div>
        <CardDetailActionContainer>
          {props.card.actions.map((action) => {
            const selected =
              props.selectorProps?.checkValueSelected(action.id) ?? false;
            const selectable = props.choiceProps.checkValue(action.id);
            const toggleable =
              props.selectorProps?.moreValuesAllowed || selected;
            const toggle = () => props.selectorProps?.toggleValue(action.id);
            return (
              <DetailCardAction
                key={action.id}
                actionId={action.id}
                actionType={action.type}
                instructions={action.instructions}
                disabled={
                  !cardHasSelectableActions || !selectable || !toggleable
                }
                selected={selected}
                onChange={toggle}
              />
            );
          })}
        </CardDetailActionContainer>
      </CardDetail>
      {chipIds.length > 0 && (
        <ChipCounterBadge>
          <ChipDisplay fullWidth={true}>
            <ChipDisplayCounter
              size="md"
              baseCount={chipIds.length}
              selectedCount={numSelectedChips}
            />
          </ChipDisplay>
        </ChipCounterBadge>
      )}
      {cardHasChoice && (
        <CardDetailFooterContainer>
          {cardHasSelectableChips && (
            <DetailCardChipSelect
              chips={props.card.chips}
              onSubmitChoice={props.onSubmitChoice}
              submitDisabled={props.submitDisabled}
              selectorProps={props.selectorProps}
            />
          )}
          {cardHasSelectableActions && !submitDisabled && (
            <Button rounded onClick={props.onSubmitChoice} color="action">
              ✓
            </Button>
          )}
        </CardDetailFooterContainer>
      )}
    </CardDetailContainer>
  );
};
