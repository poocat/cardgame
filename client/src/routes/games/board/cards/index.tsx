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

import { Button, SelectButton } from "@client/components";
import { Box, Stack } from "@client/components/layout";
import { memo, useCallback } from "react";
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
  CardDetailBody,
  CardDetailContainer,
  CardDetailMenuContainer,
} from "./detail";
import "./styles.css";
import type { ThumbnailHighlight } from "./thumbnail";
import { Thumbnail, ThumbnailContainer } from "./thumbnail";

////////////////////////////////////////////////////////////////////////////////
// Thumbnail Form Factor
////////////////////////////////////////////////////////////////////////////////

/******************************************************************************
 * ### ThumbnailPlaceholder
 ******************************************************************************/
export const ThumbnailPlaceholder = (props: {
  label?: React.ReactNode;
  highlight: ThumbnailHighlight;
}) => {
  return (
    <ThumbnailContainer highlight={props.highlight}>
      <Thumbnail variant="placeholder" label={props.label} />
    </ThumbnailContainer>
  );
};

/******************************************************************************
 * ### FaceUpThumbnail
 *
 * A complete component for displaying a card in play in the "thumbnail" form
 * factor, within its own container, which takes on different styles depending
 * on:
 * - which player is currently choosing
 * - whether or not the card or one of its actions or chips can be chosen
 * - whether or not the card or one of its actions or chips were chosen
 *   previously in the current activity
 ******************************************************************************/
export const FaceUpThumbnail = memo(
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
    // const choiceType = props.choiceProps.choiceType;
    // const selectDisabled = props.selectorProps === null;
    const cardHasChoosableValue = props.choiceProps.checkValueOnCard(cardId);
    const cardIsChoosableValue = props.choiceProps.checkValue(cardId);
    const cardWasChosenPreviously =
      props.choiceProps.checkPreviousValue(cardId);

    // const cardSelected =
    //   props.selectorProps?.checkValueSelected(cardId) ?? false;

    const chipIds = props.card.chips.map(({ id }) => id);
    const selectedChipIds =
      props.selectorProps?.selectedValues.filter((v) => chipIds.includes(v)) ??
      [];

    const expand = useCallback(() => {
      props.setDialog({ type: "card", card: props.card });
    }, [props.card, props.setDialog]);

    // const toggleCardSelect = useCallback(() => {
    //   props.selectorProps?.toggleValue(cardId);
    // }, [cardId, props.selectorProps?.toggleValue]);

    const highlight: ThumbnailHighlight =
      cardHasChoosableValue || cardIsChoosableValue
        ? "selectable"
        : cardWasChosenPreviously
          ? "selected"
          : "none";

    return (
      <ThumbnailContainer highlight={highlight}>
        <Thumbnail
          label={props.card.name}
          variant={props.card.type}
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
      </ThumbnailContainer>
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
    <SelectButton
      fullWidth
      border="dark"
      selected={props.selected}
      onClick={props.onChange}
      size="md"
      color="action"
      disabled={props.disabled}
      label={props.instructions}
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
      size="lg"
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
  /**
   * TODO!!! When card is selectable, add a button at the bottom that adds the
   * card to the current list of selected values, and close the dialog.
   */
  /**
   * TODO!!! When the actions are selectable, if the user has selected an
   * action, then closes the dialog, the action should become un-selected.
   */
  const valuesOnCard = props.choiceProps.getValuesOnCard(props.card.id);
  const selectedValues = props.selectorProps?.selectedValues ?? [];
  const selectedValuesOnCard = selectedValues.filter((v) =>
    valuesOnCard.includes(v),
  );

  const choiceType = props.choiceProps.choiceType;

  const cardIsSelectable = props.choiceProps.checkValue(props.card.id);
  const cardHasChoice = valuesOnCard.length > 0 || cardIsSelectable;
  const cardHasSelectableActions = cardHasChoice && choiceType === "actionId";
  const cardHasSelectableChips = cardHasChoice && choiceType === "chipId";

  const chipIds = props.card.chips.map(({ id }) => id);
  const numSelectedChips = cardHasSelectableChips
    ? selectedValuesOnCard.length
    : 0;

  // Disable the submit button if nothing from this card was selected.
  const submitDisabled =
    props.submitDisabled || selectedValuesOnCard.length < 1;

  // game-card-dialog__menu
  return (
    <CardDetailContainer>
      <CardDetailBody type={props.card.type}>
        <Box spacing="sm">
          <Stack spacing="sm" orientation="vertical">
            <div>{props.card.name}</div>
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
          </Stack>
        </Box>
      </CardDetailBody>
      {chipIds.length > 0 && (
        <ChipCounterBadge>
          <ChipDisplay fullWidth={true}>
            <ChipDisplayCounter
              size="lg"
              baseCount={chipIds.length}
              selectedCount={numSelectedChips}
            />
          </ChipDisplay>
        </ChipCounterBadge>
      )}
      {cardHasChoice && (
        <CardDetailMenuContainer>
          {cardHasSelectableChips && (
            <DetailCardChipSelect
              chips={props.card.chips}
              onSubmitChoice={props.onSubmitChoice}
              submitDisabled={props.submitDisabled}
              selectorProps={props.selectorProps}
            />
          )}
          {cardHasSelectableActions && !submitDisabled && (
            <Button
              rounded
              border="dark"
              size="md"
              onClick={props.onSubmitChoice}
              color="action"
            >
              ok
            </Button>
          )}
          {cardIsSelectable && (
            <Stack orientation="horizontal" spacing="sm">
              <SelectButton
                rounded
                border="dark"
                size="md"
                color="card"
                label="select"
                selected={Boolean(
                  props.selectorProps?.checkValueSelected(props.card.id),
                )}
                onClick={() => props.selectorProps?.toggleValue(props.card.id)}
              ></SelectButton>
              <Button
                rounded
                border="dark"
                size="md"
                onClick={props.onSubmitChoice}
                color="card"
              >
                ok
              </Button>
            </Stack>
          )}
        </CardDetailMenuContainer>
      )}
    </CardDetailContainer>
  );
};
