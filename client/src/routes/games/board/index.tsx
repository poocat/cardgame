import { Button, Dialog, SelectButton } from "@client/components";
import { memo, useCallback, useMemo } from "react";
import { DetailCard, FaceUpThumbnailCard } from "./cards";
import { ChipSelectMenu, DetailChipCounter, useChipSelector } from "./chips";
import { colors } from "./palette";
import type {
  ChipDigest,
  ChoiceProps,
  ChoiceType,
  ChoiceValueDigest,
  DialogProps,
  GameDigest,
  SelectorProps,
} from "./types";

const floatingChoiceBoxHeight = 125;

/******************************************************************************
 * ### GameBoardContainer
 ******************************************************************************/
const GameBoardContainer = (props: { children?: React.ReactNode }) => {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: colors.board.alpha(1),
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### GameBoardFooter
 *
 * The footer is mostly a blank space to put at the bottom of the game board,
 * so that when the player scrolls all the way to the bottom, the floating
 * dialog will not cover anything.
 ******************************************************************************/
const GameBoardFooter = (props: { children?: React.ReactNode }) => {
  return (
    <div
      style={{
        width: "100%",
        height: floatingChoiceBoxHeight,
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerArea
 ******************************************************************************/
const GameBoardPlayerArea = (props: { children?: React.ReactNode }) => {
  return <div>{props.children}</div>;
};

/******************************************************************************
 * ### const GameBoardPlayerHeader = (props: { playerName: string }) => {

 ******************************************************************************/
const GameBoardPlayerHeader = (props: { playerName: string }) => {
  return (
    <div style={{ paddingLeft: 10, paddingRight: 10, margin: 10 }}>
      <h2>{props.playerName}</h2>
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerChipContainer
 ******************************************************************************/
const GameBoardPlayerChipContainer = (props: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        gap: 5,
        padding: 10,
        marginLeft: 10,
        marginRight: 10,
        borderRadius: 5,
        backgroundColor: colors.board.scale(0.9),
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerReserveContainer
 ******************************************************************************/
const GameBoardPlayerChipContainerHeading = (props: {
  children: React.ReactNode;
}) => {
  return <div style={{ fontSize: 10, marginBottom: 5 }}>{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerChipContainerBody
 ******************************************************************************/
const GameBoardPlayerChipContainerBody = (props: {
  children: React.ReactNode;
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### GameBoardCardArray
 *
 * Establishes spacing between thumbnail cards.
 ******************************************************************************/
const GameBoardCardArray = (props: { children?: React.ReactNode }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 3,
      }}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerHandArea
 ******************************************************************************/
const GameBoardPlayerHandArea = (props: { children?: React.ReactNode }) => {
  return (
    <div style={{ padding: 10, margin: 10 }}>
      <h4>Cards in Hand:</h4>
      <GameBoardCardArray>{props.children}</GameBoardCardArray>
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerPlayArea
 ******************************************************************************/
const GameBoardPlayerPlayArea = (props: { children?: React.ReactNode }) => {
  return (
    <div style={{ padding: 10, margin: 10 }}>
      <h4>Cards in Play:</h4>
      <GameBoardCardArray>{props.children}</GameBoardCardArray>
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerChipContainerMenu
 *
 * Composition of a chip counter and a menu for selecting chips from the given
 * pool.
 ******************************************************************************/
const GameBoardPlayerChipContainerMenu = memo(
  (props: {
    chips: ChipDigest[];
    submitDisabled: boolean;
    onSubmitChoice: () => void;
    choiceProps: ChoiceProps;
    selectorProps: SelectorProps | null;
  }) => {
    const selectableChipIds = useMemo(
      () =>
        props.chips
          .filter((c) => props.choiceProps.checkValue(c.id))
          .map((c) => c.id),
      [props.chips, props.choiceProps.checkValue],
    );

    const { numSelected, addChip, removeChip } = useChipSelector({
      chips: props.chips,
      selectorProps: props.selectorProps,
    });

    return (
      <>
        <DetailChipCounter
          count={props.chips.length}
          numSelected={numSelected}
        />
        {props.selectorProps && selectableChipIds.length > 0 && (
          <ChipSelectMenu
            numSelected={numSelected}
            onIncrement={addChip}
            onDecrement={removeChip}
            onSubmit={props.onSubmitChoice}
            disableIncrement={!props.selectorProps.moreValuesAllowed}
            disableSubmit={props.submitDisabled}
          />
        )}
      </>
    );
  },
);

/******************************************************************************
 * ### GameBoardChoiceMenuValueSelect
 *
 * A toggle button that represents any arbitrary selectable value.
 ******************************************************************************/
const GameBoardChoiceMenuValueSelect = (
  props: {
    choiceType: ChoiceType;
    value: string;
    label: string;
    disabled: boolean;
    selected: boolean;
  } & Pick<SelectorProps, "toggleValue">,
) => {
  const toggle = useCallback(() => {
    props.toggleValue(props.value);
  }, [props.toggleValue, props.value]);

  let color = colors.board;
  switch (props.choiceType) {
    case "actionId":
      color = colors.actions;
      break;
    case "cardId":
      color = colors.cards;
      break;
    case "chipId":
      color = colors.chips;
      break;
  }

  return (
    <SelectButton
      label={props.label}
      disabled={props.disabled}
      selected={props.selected}
      onClick={toggle}
      minHeight={30}
      fontSize={12}
      color={color}
    />
  );
};

/******************************************************************************
 * ### GameBoardChoiceMenu
 ******************************************************************************/
const GameBoardChoiceMenu = memo(
  (
    props: {
      instructions: string;
      choiceType: ChoiceType;
      values: ChoiceValueDigest[];
      onSubmitChoice: () => void;
      submitDisabled: boolean;
    } & Pick<
      SelectorProps,
      "checkValueSelected" | "toggleValue" | "moreValuesAllowed"
    >,
  ) => {
    return (
      <div
        style={{
          backgroundColor: "white",
          position: "fixed",
          borderTop: "1px solid",
          width: "100%",
          bottom: 0,
          right: 0,
          left: 0,
          maxHeight: floatingChoiceBoxHeight,
          height: floatingChoiceBoxHeight,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            padding: 3,
            gap: 3,
          }}
        >
          <div>{props.instructions}</div>
          <div>
            <Button
              height={40}
              fontSize={16}
              horizontalPadding={10}
              color={colors.board}
              disabled={props.submitDisabled}
              onClick={props.onSubmitChoice}
            >
              Submit Choices
            </Button>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              overflowX: "auto",
              gap: 3,
            }}
          >
            {props.values.map(({ value, label }) => {
              const selected = props.checkValueSelected(value);
              const disabled = !selected && !props.moreValuesAllowed;
              return (
                <GameBoardChoiceMenuValueSelect
                  key={value}
                  value={value}
                  label={label}
                  selected={selected}
                  disabled={disabled}
                  choiceType={props.choiceType}
                  toggleValue={props.toggleValue}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  },
);

/******************************************************************************
 * ### GameBoard
 ******************************************************************************/
export const GameBoard = (props: {
  game: GameDigest;
  onSubmitChoice: () => void;
  dialogProps: DialogProps;
  selectorProps: SelectorProps;
  choiceProps: ChoiceProps;
}) => {
  const observingPlayer = props.game.observingPlayer;
  const choosingPlayerId = props.game.activity.choice.choosingPlayerId;
  const observingPlayerIsChoosing = observingPlayer?.id === choosingPlayerId;
  const submitDisabled = props.selectorProps.moreValuesNeeded;

  const cardSelectEnabled = useCallback(
    (cardId: string) =>
      observingPlayerIsChoosing && props.choiceProps.checkValueOnCard(cardId),
    [observingPlayerIsChoosing, props.choiceProps.checkValueOnCard],
  );

  const someChipsSelectable = useCallback(
    (chips: ChipDigest[]) =>
      chips.some((c) => props.choiceProps.checkValue(c.id)),
    [props.choiceProps.checkValue],
  );

  const dialogTitle = useMemo(() => {
    switch (props.dialogProps.value?.type) {
      case "card":
        return `Details for Card: "${props.dialogProps.value.card.name}"`;
      default:
        return "";
    }
  }, [props.dialogProps.value]);

  return (
    <GameBoardContainer>
      {props.game.otherPlayers.map((player) => (
        <GameBoardPlayerArea key={player.id}>
          <hr />
          <GameBoardPlayerHeader playerName={player.name} />
          <GameBoardPlayerPlayArea>
            {player.cardsInPlay.map((card) => (
              <FaceUpThumbnailCard
                key={card.id}
                variant="inPlay"
                card={card}
                setDialog={props.dialogProps.set}
                choiceProps={props.choiceProps}
                selectorProps={
                  cardSelectEnabled(card.id) ? props.selectorProps : null
                }
              />
            ))}
          </GameBoardPlayerPlayArea>
          <GameBoardPlayerChipContainer>
            <GameBoardPlayerChipContainerHeading>
              Reserve
            </GameBoardPlayerChipContainerHeading>
            <GameBoardPlayerChipContainerBody>
              <GameBoardPlayerChipContainerMenu
                chips={player.chipsInReserve}
                choiceProps={props.choiceProps}
                onSubmitChoice={props.onSubmitChoice}
                submitDisabled={submitDisabled}
                selectorProps={
                  someChipsSelectable(player.chipsInReserve)
                    ? props.selectorProps
                    : null
                }
              />
            </GameBoardPlayerChipContainerBody>
          </GameBoardPlayerChipContainer>
        </GameBoardPlayerArea>
      ))}
      {observingPlayer && (
        <GameBoardPlayerArea>
          <hr />
          <GameBoardPlayerHeader playerName={observingPlayer.name} />
          <GameBoardPlayerPlayArea>
            {observingPlayer.cardsInPlay.map((card) => (
              <FaceUpThumbnailCard
                key={card.id}
                variant="inPlay"
                card={card}
                setDialog={props.dialogProps.set}
                choiceProps={props.choiceProps}
                selectorProps={
                  cardSelectEnabled(card.id) ? props.selectorProps : null
                }
              />
            ))}
          </GameBoardPlayerPlayArea>
          <GameBoardPlayerChipContainer>
            <GameBoardPlayerChipContainerHeading>
              Reserve
            </GameBoardPlayerChipContainerHeading>
            <GameBoardPlayerChipContainerBody>
              <GameBoardPlayerChipContainerMenu
                chips={observingPlayer.chipsInReserve}
                choiceProps={props.choiceProps}
                onSubmitChoice={props.onSubmitChoice}
                submitDisabled={submitDisabled}
                selectorProps={
                  someChipsSelectable(observingPlayer.chipsInReserve)
                    ? props.selectorProps
                    : null
                }
              />
            </GameBoardPlayerChipContainerBody>
          </GameBoardPlayerChipContainer>
          <GameBoardPlayerHandArea>
            {observingPlayer.cardsInHand.map((card) => (
              <FaceUpThumbnailCard
                key={card.id}
                variant="inHand"
                card={card}
                setDialog={props.dialogProps.set}
                choiceProps={props.choiceProps}
                selectorProps={
                  cardSelectEnabled(card.id) ? props.selectorProps : null
                }
              />
            ))}
          </GameBoardPlayerHandArea>
        </GameBoardPlayerArea>
      )}
      {observingPlayerIsChoosing && (
        <GameBoardChoiceMenu
          instructions={props.game.activity.choice.instructions}
          choiceType={props.game.activity.choice.type}
          values={props.game.activity.choice.values}
          onSubmitChoice={props.onSubmitChoice}
          submitDisabled={submitDisabled}
          toggleValue={props.selectorProps.toggleValue}
          checkValueSelected={props.selectorProps.checkValueSelected}
          moreValuesAllowed={props.selectorProps.moreValuesAllowed}
        />
      )}
      <GameBoardFooter />
      <Dialog
        title={dialogTitle}
        description=""
        isOpen={props.dialogProps.isOpen}
        onClose={props.dialogProps.close}
      >
        {props.dialogProps.value?.type === "card" && (
          <DetailCard
            card={props.dialogProps.value.card}
            onSubmitChoice={props.onSubmitChoice}
            submitDisabled={submitDisabled}
            choiceProps={props.choiceProps}
            selectorProps={
              cardSelectEnabled(props.dialogProps.value.card.id)
                ? props.selectorProps
                : null
            }
          />
        )}
      </Dialog>
    </GameBoardContainer>
  );
};
