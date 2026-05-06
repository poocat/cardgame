import { Button, ButtonBase, SelectButton } from "@client/components";
import { Edge, Stack } from "@client/components/layout";
import type { Size } from "@client/components/types";
import { memo, useCallback } from "react";
import {
  ChipCounter,
  ChipCounterEdge,
  ChipSelector,
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
  CardDetailActions,
  CardDetailBackground,
  CardDetailBody,
  CardDetailContainer,
  CardDetailForeground,
  CardDetailHeader,
  CardDetailLink,
  CardDetailMenuContainer,
  CardDetailName,
  CardDetailTriggerInstructions,
} from "./detail";
import { CardImage } from "./image";
import "./styles.css";
import { Tooltip } from "@client/components/tooltips";
import { Mini } from "./mini";
import {
  CardPile,
  CardPileLabel,
  CardPileStack,
  CardPileStackItem,
} from "./pile";
import type { ThumbnailEmphasis } from "./thumbnail";
import { Thumbnail, ThumbnailContainer } from "./thumbnail";

/******************************************************************************
 * ### CardSelector
 ******************************************************************************/
export const CardSelector = (props: {
  size: Size;
  selectDisabled: boolean;
  selected: boolean;
  onToggle: () => void;
}) => {
  const symbol = props.selected ? "☑" : "☐";
  return (
    <div className="game-card-selector">
      <ButtonBase disabled={props.selectDisabled} onClick={props.onToggle}>
        <div
          className={`game-card-selector__button game-card-selector__button--size-${props.size}`}
        >
          {symbol}
        </div>
      </ButtonBase>
    </div>
  );
};

////////////////////////////////////////////////////////////////////////////////
// Thumbnail Form Factor
////////////////////////////////////////////////////////////////////////////////

/******************************************************************************
 * ### CardSelectorEdge
 *
 * A container for elements to be displayed above or below a thumbnail card.
 ******************************************************************************/
const CardSelectorEdge = (props: { children?: React.ReactNode }) => {
  return (
    <Edge variant="horizontal-end">
      <div className="game-card-edge">{props.children}</div>
    </Edge>
  );
};

/******************************************************************************
 * ### ThumbnailPlaceholder
 ******************************************************************************/
export const ThumbnailPlaceholder = (props: {
  children?: React.ReactNode;
  emphasis?: ThumbnailEmphasis;
}) => {
  return (
    <ThumbnailContainer emphasis={props.emphasis}>
      <Thumbnail placeholder>{props.children}</Thumbnail>
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
      submitting: boolean;
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
    const valuesOnCard = props.choiceProps.getValuesOnCard(props.card.id);

    const cardIsSelectable = props.choiceProps.checkValue(props.card.id);
    const cardIsSelected = Boolean(
      props.selectorProps?.checkValueSelected(props.card.id),
    );

    const cardWasChosenPreviously = props.choiceProps.checkPreviousValue(
      props.card.id,
    );

    const cardHasChoice = valuesOnCard.length > 0 || cardIsSelectable;

    const cardIsExhausted =
      props.variant === "inPlay" ? props.card.exhausted : false;

    const { numSelected } = useChipSelector({
      chips: props.card.chips,
      selectorProps: props.selectorProps,
    });

    const expand = useCallback(() => {
      props.setDialog({ type: "card", card: props.card });
    }, [props.card, props.setDialog]);

    const emphasis =
      props.selectorProps && cardHasChoice
        ? "animated"
        : cardHasChoice
          ? "solid"
          : cardWasChosenPreviously
            ? "outlined"
            : undefined;

    return (
      <ThumbnailContainer emphasis={emphasis} exhausted={cardIsExhausted}>
        <Thumbnail onClick={expand}>
          <CardImage variant="thumbnail" name={props.card.name} />
        </Thumbnail>
        {props.card.chips.length > 0 && (
          <ChipCounterEdge size="sm">
            <ChipCounter
              size="sm"
              side="left"
              light={props.card.type === "consumer"}
              baseCount={props.card.chips.length}
              selectedCount={numSelected}
            />
          </ChipCounterEdge>
        )}
        {cardIsSelectable && props.selectorProps && (
          <CardSelectorEdge>
            <CardSelector
              size="md"
              selected={cardIsSelected}
              selectDisabled={
                props.submitting ||
                (!cardIsSelected && !props.selectorProps.moreValuesAllowed)
              }
              onToggle={() => {
                props.selectorProps?.toggleValue(props.card.id);
              }}
            />
          </CardSelectorEdge>
        )}
      </ThumbnailContainer>
    );
  },
);

////////////////////////////////////////////////////////////////////////////////
// Mini Form Factor
////////////////////////////////////////////////////////////////////////////////

/******************************************************************************
 * ### MiniPlaceholder
 ******************************************************************************/
export const MiniPlaceholder = (props: { children?: React.ReactNode }) => {
  return <Mini placeholder>{props.children}</Mini>;
};

/******************************************************************************
 * ### FaceUpMini
 *
 * A face-up card rendered in the "mini" form factor. Clicking opens the card
 * detail dialog.
 ******************************************************************************/
export const FaceUpMini = memo(
  (props: { card: VisibleCardDigest; setDialog: DialogProps["set"] }) => {
    const expand = useCallback(() => {
      props.setDialog({ type: "card", card: props.card });
    }, [props.card, props.setDialog]);

    return (
      <Mini onClick={expand}>
        <CardImage variant="thumbnail" name={props.card.name} />
      </Mini>
    );
  },
);

/******************************************************************************
 * ### DiscardPile
 *
 * Displays the most recently discarded cards at the top of a "pile".
 ******************************************************************************/
export const DiscardPile = (props: {
  cardsVisible: VisibleCardDigest[];
  totalCount: number;
  setDialog: DialogProps["set"];
}) => {
  return (
    <CardPile>
      <CardPileLabel>Discard ({props.totalCount})</CardPileLabel>
      <CardPileStack>
        <CardPileStackItem>
          <MiniPlaceholder />
        </CardPileStackItem>
        {props.cardsVisible.map((c, i) => (
          <CardPileStackItem key={c.id} index={i + 1}>
            <FaceUpMini card={c} setDialog={props.setDialog} />
          </CardPileStackItem>
        ))}
      </CardPileStack>
    </CardPile>
  );
};

/******************************************************************************
 * ### HandPile
 *
 * Indicates how many cards are in a non-observing player's hand.
 ******************************************************************************/
export const HandPile = (props: { count: number }) => {
  return (
    <CardPile>
      <CardPileLabel>Hand ({props.count})</CardPileLabel>
      <CardPileStack>
        <CardPileStackItem>
          <MiniPlaceholder />
        </CardPileStackItem>
      </CardPileStack>
    </CardPile>
  );
};

////////////////////////////////////////////////////////////////////////////////
// Details Form Factor
////////////////////////////////////////////////////////////////////////////////

const DetailCardAction = (props: {
  selected: boolean;
  disabled: boolean;
  submitting: boolean;
  actionType: string;
  actionId: string;
  instructions: string;
  annotations: string[];
  onChange: () => void;
}) => {
  const label = `[${props.actionType}] ${props.instructions}`;
  const button = (
    <SelectButton
      fullWidth
      border="dark"
      selected={props.selected}
      onClick={props.onChange}
      size="sm"
      color="action"
      disabled={props.disabled || props.submitting}
      label={label}
    />
  );
  if (props.annotations.length > 0) {
    return (
      <Tooltip side="right" content={props.annotations.join(" ")}>
        {button}
      </Tooltip>
    );
  }
  return button;
};

/******************************************************************************
 * ### DetailCardChipSelect
 ******************************************************************************/
const DetailCardChipSelect = (props: {
  chips: ChipDigest[];
  onSubmitChoice: () => void;
  submitDisabled: boolean;
  submitting: boolean;
  selectorProps: SelectorProps | null;
}) => {
  const { numSelected, addChip, removeChip } = useChipSelector({
    chips: props.chips,
    selectorProps: props.selectorProps,
  });

  return (
    <ChipSelector
      size="lg"
      light={true}
      numSelected={numSelected}
      submitting={props.submitting}
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
  submitting: boolean;
  choiceProps: ChoiceProps;
  selectorProps: SelectorProps | null;
}) => {
  const valuesOnCard = props.choiceProps.getValuesOnCard(props.card.id);
  const selectedValues = props.selectorProps?.selectedValues ?? [];
  const selectedValuesOnCard = selectedValues.filter((v) =>
    valuesOnCard.includes(v),
  );

  const choiceType = props.choiceProps.choiceType;

  const cardIsSelectable = props.choiceProps.checkValue(props.card.id);
  const cardIsSelected = Boolean(
    props.selectorProps?.checkValueSelected(props.card.id),
  );

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
      <CardDetailHeader>
        <CardDetailName>{props.card.display}</CardDetailName>
        {props.card.imageSourceUrl && (
          <CardDetailLink url={props.card.imageSourceUrl} />
        )}
      </CardDetailHeader>
      <CardDetailBody type={props.card.type}>
        <CardDetailBackground>
          <CardImage variant="fullsize" name={props.card.name} />
        </CardDetailBackground>
        <CardDetailForeground>
          <div />
          <CardDetailActions>
            {props.card.triggerInstructions && (
              <CardDetailTriggerInstructions>
                {props.card.triggerInstructions}
              </CardDetailTriggerInstructions>
            )}
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
                  annotations={action.annotations}
                  disabled={
                    !cardHasSelectableActions || !selectable || !toggleable
                  }
                  submitting={props.submitting}
                  selected={selected}
                  onChange={toggle}
                />
              );
            })}
          </CardDetailActions>
        </CardDetailForeground>
      </CardDetailBody>
      {chipIds.length > 0 && (
        <ChipCounterEdge size="md">
          <ChipCounter
            size="md"
            side="left"
            light={true}
            baseCount={chipIds.length}
            selectedCount={numSelectedChips}
          />
        </ChipCounterEdge>
      )}
      {cardHasChoice && (
        <CardDetailMenuContainer>
          {cardHasSelectableChips && (
            <DetailCardChipSelect
              chips={props.card.chips}
              onSubmitChoice={props.onSubmitChoice}
              submitDisabled={submitDisabled}
              submitting={props.submitting}
              selectorProps={props.selectorProps}
            />
          )}
          {cardHasSelectableActions && (
            <Button
              rounded
              border="dark"
              size="lg"
              onClick={props.onSubmitChoice}
              color="action"
              disabled={submitDisabled || props.submitting}
            >
              {props.submitting ? "..." : "ok"}
            </Button>
          )}
          {cardIsSelectable && props.selectorProps && (
            <Stack orientation="horizontal" spacing="sm">
              <SelectButton
                rounded
                border="dark"
                size="lg"
                color="card"
                label="select"
                disabled={
                  props.submitting ||
                  (!cardIsSelected && !props.selectorProps.moreValuesAllowed)
                }
                selected={cardIsSelected}
                onClick={() => props.selectorProps?.toggleValue(props.card.id)}
              ></SelectButton>
              <Button
                rounded
                border="dark"
                size="lg"
                disabled={
                  props.submitting ||
                  !cardIsSelected ||
                  props.selectorProps?.moreValuesNeeded
                }
                onClick={props.onSubmitChoice}
                color="card"
              >
                {props.submitting ? "..." : "ok"}
              </Button>
            </Stack>
          )}
        </CardDetailMenuContainer>
      )}
    </CardDetailContainer>
  );
};
