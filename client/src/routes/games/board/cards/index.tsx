import { Button, ButtonBase, SelectButton } from "@client/components";
import { Edge, Stack } from "@client/components/layout";
import type { Size } from "@client/components/types";
import { FullsizeCardDisplay } from "@client/features/cards/fullsize";
import { CardImage } from "@client/features/cards/image";
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
import "@client/features/cards/styles.css";
import "./styles.css";
import { Msg } from "@client/components/msg";
import { Tooltip } from "@client/components/tooltips";
import type { ThumbnailEmphasis } from "@client/features/cards/thumbnail";
import {
  ThumbnailCard,
  ThumbnailCardContainer,
} from "@client/features/cards/thumbnail";
import type { Message } from "../types";
import {
  CardPile,
  CardPileLabel,
  CardPileStack,
  CardPileStackItem,
} from "./pile";

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
 * ### ThumbnailCardPlaceholder
 ******************************************************************************/
export const ThumbnailCardPlaceholder = (props: {
  children?: React.ReactNode;
  emphasis?: ThumbnailEmphasis;
}) => {
  return (
    <ThumbnailCardContainer emphasis={props.emphasis}>
      <ThumbnailCard placeholder>{props.children}</ThumbnailCard>
    </ThumbnailCardContainer>
  );
};

/******************************************************************************
 * ### ThumbnailCardFaceUp
 *
 * A complete component for displaying a card in play in the "thumbnail" form
 * factor, within its own container, which takes on different styles depending
 * on:
 * - which player is currently choosing
 * - whether or not the card or one of its actions or chips can be chosen
 * - whether or not the card or one of its actions or chips were chosen
 *   previously in the current activity
 ******************************************************************************/
export const ThumbnailCardFaceUp = memo(
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
      <ThumbnailCardContainer emphasis={emphasis} exhausted={cardIsExhausted}>
        <ThumbnailCard onClick={expand}>
          <CardImage
            variant="thumbnail"
            name={props.card.name}
            type={props.card.type}
            subtype={props.card.subtype?.key}
          />
        </ThumbnailCard>
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
      </ThumbnailCardContainer>
    );
  },
);

////////////////////////////////////////////////////////////////////////////////
// Mini Form Factor
////////////////////////////////////////////////////////////////////////////////

/******************************************************************************
 * ### MiniCardPlaceholder
 ******************************************************************************/
export const MiniCardPlaceholder = (props: { children?: React.ReactNode }) => {
  return (
    <ThumbnailCard mini placeholder>
      {props.children}
    </ThumbnailCard>
  );
};

/******************************************************************************
 * ### MiniCardFaceUp
 *
 * A face-up card rendered in the "mini" form factor. Clicking opens the full
 * card dialog.
 ******************************************************************************/
export const MiniCardFaceUp = memo(
  (props: { card: VisibleCardDigest; setDialog: DialogProps["set"] }) => {
    const expand = useCallback(() => {
      props.setDialog({ type: "card", card: props.card });
    }, [props.card, props.setDialog]);

    return (
      <ThumbnailCard mini onClick={expand}>
        <CardImage
          variant="thumbnail"
          name={props.card.name}
          type={props.card.type}
          subtype={props.card.subtype?.key}
        />
      </ThumbnailCard>
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
          <MiniCardPlaceholder />
        </CardPileStackItem>
        {props.cardsVisible.map((c, i) => (
          <CardPileStackItem key={c.id} index={i + 1}>
            <MiniCardFaceUp card={c} setDialog={props.setDialog} />
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
          <MiniCardPlaceholder />
        </CardPileStackItem>
      </CardPileStack>
    </CardPile>
  );
};

////////////////////////////////////////////////////////////////////////////////
// Fullsize Form Factor
////////////////////////////////////////////////////////////////////////////////

const FullsizeCardAction = (props: {
  selected: boolean;
  disabled: boolean;
  submitting: boolean;
  actionType: string;
  actionId: string;
  instructions: Message | null;
  annotations: Message[];
  onChange: () => void;
}) => {
  const button = (
    <SelectButton
      fullWidth
      border="dark"
      selected={props.selected}
      onClick={props.onChange}
      size="sm"
      color="action"
      disabled={props.disabled || props.submitting}
      label={<Msg value={props.instructions} />}
    />
  );
  if (props.annotations.length > 0) {
    const content = props.annotations.map((anno, i) => (
      <Msg key={`${i}-${anno.key}`} value={anno} />
    ));
    return (
      <Tooltip side="right" content={content}>
        {button}
      </Tooltip>
    );
  }
  return button;
};

/******************************************************************************
 * ### FullsizeCardMenu
 *
 * The controls beneath an enlarged card, for taking the choice that is
 * available on it.
 ******************************************************************************/
const FullsizeCardMenu = (props: { children?: React.ReactNode }) => {
  return <div className="game-card-fullsize-menu">{props.children}</div>;
};

/******************************************************************************
 * ### FullsizeCardChipSelect
 ******************************************************************************/
const FullsizeCardChipSelect = (props: {
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
 * ### FullsizeCardFaceUp
 *
 * Complete composition of a card in the fullsize form-factor.
 ******************************************************************************/
export const FullsizeCardFaceUp = (props: {
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
    <FullsizeCardDisplay
      card={props.card}
      actions={props.card.actions.map((action) => {
        const selected =
          props.selectorProps?.checkValueSelected(action.id) ?? false;
        const selectable = props.choiceProps.checkValue(action.id);
        const toggleable = props.selectorProps?.moreValuesAllowed || selected;
        const toggle = () => props.selectorProps?.toggleValue(action.id);
        return (
          <FullsizeCardAction
            key={action.id}
            actionId={action.id}
            actionType={action.type}
            instructions={action.instructions ?? null}
            annotations={action.annotations}
            disabled={!cardHasSelectableActions || !selectable || !toggleable}
            submitting={props.submitting}
            selected={selected}
            onChange={toggle}
          />
        );
      })}
    >
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
        <FullsizeCardMenu>
          {cardHasSelectableChips && (
            <FullsizeCardChipSelect
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
        </FullsizeCardMenu>
      )}
    </FullsizeCardDisplay>
  );
};
