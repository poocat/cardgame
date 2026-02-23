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
import { CardImage } from "./image";
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
  children?: React.ReactNode;
  highlight: ThumbnailHighlight;
}) => {
  return (
    <ThumbnailContainer highlight={props.highlight}>
      <Thumbnail>{props.children}</Thumbnail>
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
    const cardHasChoosableValue = props.choiceProps.checkValueOnCard(cardId);
    const cardIsChoosableValue = props.choiceProps.checkValue(cardId);
    const cardWasChosenPreviously =
      props.choiceProps.checkPreviousValue(cardId);
    const cardIsExhausted =
      props.variant === "inPlay" ? props.card.exhausted : false;

    const chipIds = props.card.chips.map(({ id }) => id);
    const selectedChipIds =
      props.selectorProps?.selectedValues.filter((v) => chipIds.includes(v)) ??
      [];

    const expand = useCallback(() => {
      props.setDialog({ type: "card", card: props.card });
    }, [props.card, props.setDialog]);

    const highlight: ThumbnailHighlight =
      cardHasChoosableValue || cardIsChoosableValue
        ? "selectable"
        : cardWasChosenPreviously
          ? "selected"
          : "none";

    return (
      <ThumbnailContainer highlight={highlight} exhausted={cardIsExhausted}>
        <Thumbnail onClick={expand}>
          <CardImage name={props.card.name} type={props.card.type} />
        </Thumbnail>
        {props.card.chips.length > 0 && (
          <ChipCounterBadge>
            <ChipDisplay side="left" inverted={false} fullWidth={true}>
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
  const label = `[${props.actionType}] ${props.instructions}`;
  return (
    <SelectButton
      fullWidth
      border="dark"
      selected={props.selected}
      onClick={props.onChange}
      size="md"
      color="action"
      disabled={props.disabled}
      label={label}
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
   * TODO!!! When card is selectable, would be nice to combine "select" and
   * "submit" into a single click.
   */
  /**
   * TODO!!! When actions are selectable, and user has selected an action,
   * but clicks away instead of submitting, would be nice if the action was
   * de-selected.
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
          <ChipDisplay side="left" inverted={false} fullWidth={true}>
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
