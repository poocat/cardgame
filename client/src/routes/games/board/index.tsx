import { Button, Dialog, SelectButton } from "@client/components";
import { Box, Stack } from "@client/components/layout";
import type { Color } from "@client/components/types";
import type React from "react";
import { memo, useCallback, useMemo } from "react";
import { DetailCard, FaceUpThumbnailCard } from "./cards";
import {
  ChipArea,
  ChipAreaLabel,
  ChipDisplay,
  ChipDisplayCounter,
  ChipDisplaySelector,
  useChipSelector,
} from "./chips";
import "./styles.css";
import type {
  ChipDigest,
  ChoiceProps,
  ChoiceType,
  ChoiceValueDigest,
  DialogProps,
  GameDigest,
  SelectorProps,
} from "./types";

type Side = "left" | "right";

const playerColors = ["red", "yellow", "green", "blue"] as const;
type PlayerColor = (typeof playerColors)[number];

function getPlayerSide(playerIndex: number): Side {
  return playerIndex % 2 > 0 ? "right" : "left";
}
function getPlayerColor(playerIndex: number): PlayerColor {
  return playerColors[playerIndex];
}

/******************************************************************************
 * ### GameBoardContainer
 ******************************************************************************/
const GameBoardContainer = (props: {
  numPlayers: number;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={`game game-container game-container--size-${props.numPlayers}`}
    >
      <div className="game-background">
        <div
          className={`game-background-window game-background-window--size-${props.numPlayers}`}
        ></div>
      </div>
      <div className="game-foreground">
        <div className="game-header-spacer"></div>
        {props.children}
      </div>
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerArea
 ******************************************************************************/
const GameBoardPlayerArea = (props: {
  playerIndex: number;
  children: React.ReactNode;
}) => {
  const side = getPlayerSide(props.playerIndex);
  const className = `game-player-area game-player-area--${side}`;
  return <div className={className}>{props.children}</div>;
};

const GameBoardPlayerTablet = (props: {
  playerIndex: number;
  children: React.ReactNode;
}) => {
  const playerColor = getPlayerColor(props.playerIndex);
  const className = `game-player-tablet game-player-tablet--${playerColor}`;
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerTabletHeader
 ******************************************************************************/
const GameBoardPlayerTabletHeader = (props: { children: React.ReactNode }) => {
  return <div className="game-player-tablet__header">{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerTabletHeaderName
 ******************************************************************************/
const GameBoardPlayerTabletHeaderName = (props: { playerName: string }) => {
  return <div className="game-player-tablet__name">{props.playerName}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerTabletHeaderCardArea
 ******************************************************************************/
const GameBoardPlayerTabletHeaderCardArea = (props: {
  children: React.ReactNode;
}) => {
  return <div className="game-player-tablet__card-area">{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerTabletHeader
 ******************************************************************************/
const GameBoardPlayerTabletFooter = (props: { children: React.ReactNode }) => {
  return <div className="game-player-tablet__footer">{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerHandArea
 ******************************************************************************/
const GameBoardPlayerHandArea = (props: { children?: React.ReactNode }) => {
  return <div className="game-player-hand">{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerCenter
 ******************************************************************************/
const GameBoardPlayerCenter = (props: { children?: React.ReactNode }) => {
  return <div className="game-player-center">{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerCenter
 ******************************************************************************/
const GameBoardPlayerCenterCards = (props: { children?: React.ReactNode }) => {
  return <div className="game-player-center__cards">{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerChipContainerMenu
 *
 * Composition of a chip counter and a menu for selecting chips from the given
 * pool.
 ******************************************************************************/
const GameBoardChipMenu = memo(
  (props: {
    label: string;
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

    // TODO!!! This should be false if the observing player is not the one selecting!!!
    const selecting =
      props.selectorProps !== null && selectableChipIds.length > 0;

    return (
      // TODO!!! Move fullwidth to <ChipArea/>???
      <ChipArea>
        <ChipAreaLabel>{props.label}</ChipAreaLabel>
        <ChipDisplay fullWidth={selecting}>
          <ChipDisplayCounter
            size="sm"
            baseCount={props.chips.length}
            selectedCount={numSelected}
          />
          {selecting && (
            <ChipDisplaySelector
              size="sm"
              numSelected={numSelected}
              onIncrement={addChip}
              onDecrement={removeChip}
              onSubmit={props.onSubmitChoice}
              disableSubmit={props.submitDisabled}
            />
          )}
        </ChipDisplay>
      </ChipArea>
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

  let color: Color = "primary";
  switch (props.choiceType) {
    case "actionId":
      color = "action";
      break;
    case "cardId":
      color = "card";
      break;
    case "chipId":
      color = "chip";
      break;
  }

  return (
    <SelectButton
      size="md"
      border="dark"
      color={color}
      label={props.label}
      disabled={props.disabled}
      selected={props.selected}
      onClick={toggle}
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
      <div className="game-footer-menu">
        <Stack spacing="sm" orientation="vertical">
          <Box spacing="sm">{props.instructions}</Box>
          <Box spacing="sm">
            <Button
              border="dark"
              color="secondary"
              size="md"
              disabled={props.submitDisabled}
              onClick={props.onSubmitChoice}
            >
              Submit Choices
            </Button>
          </Box>
          <Box spacing="sm">
            <Stack spacing="sm" orientation="horizontal">
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
            </Stack>
          </Box>
        </Stack>
      </div>
    );
  },
);

/******************************************************************************
 * ### GameBoard
 ******************************************************************************/
export const GameBoard = memo(
  (props: {
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
        observingPlayerIsChoosing &&
        (props.choiceProps.checkValueOnCard(cardId) ||
          props.choiceProps.checkValue(cardId)),
      [
        observingPlayerIsChoosing,
        props.choiceProps.checkValue,
        props.choiceProps.checkValueOnCard,
      ],
    );

    const someChipsSelectable = useCallback(
      (chips: ChipDigest[]) =>
        observingPlayerIsChoosing &&
        chips.some((c) => props.choiceProps.checkValue(c.id)),
      [observingPlayerIsChoosing, props.choiceProps.checkValue],
    );

    const dialogTitle = useMemo(() => {
      switch (props.dialogProps.value?.type) {
        case "card":
          return `Details for Card: "${props.dialogProps.value.card.name}"`;
        default:
          return "";
      }
    }, [props.dialogProps.value]);

    // TODO!!! Might be nice to just have this number on hand...
    const observingPlayerIndex = props.game.otherPlayers.length;
    const numPlayers =
      observingPlayerIndex + (props.game.observingPlayer ? 1 : 0);

    return (
      <GameBoardContainer numPlayers={numPlayers}>
        {props.game.otherPlayers.map((player, ix) => (
          <GameBoardPlayerArea playerIndex={ix} key={player.id}>
            <GameBoardPlayerHandArea>
              <div
                style={{
                  height: "50px",
                  width: "50px",
                  border: "1px solid black",
                }}
              >
                {player.cardsInHand.length}
              </div>
            </GameBoardPlayerHandArea>
            <GameBoardPlayerTablet playerIndex={ix}>
              <GameBoardPlayerTabletHeader>
                <GameBoardPlayerTabletHeaderName playerName={player.name} />
                <GameBoardPlayerTabletHeaderCardArea>
                  {player.cardsInPlay
                    .filter((card) => card.type === "producer")
                    .map((card) => (
                      <FaceUpThumbnailCard
                        key={card.id}
                        variant="inPlay"
                        card={card}
                        setDialog={props.dialogProps.set}
                        choiceProps={props.choiceProps}
                        selectorProps={
                          cardSelectEnabled(card.id)
                            ? props.selectorProps
                            : null
                        }
                      />
                    ))}
                </GameBoardPlayerTabletHeaderCardArea>
              </GameBoardPlayerTabletHeader>
              <GameBoardPlayerTabletFooter>
                <GameBoardChipMenu
                  label="In Reserve"
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
              </GameBoardPlayerTabletFooter>
            </GameBoardPlayerTablet>
            <GameBoardPlayerCenter>
              <GameBoardPlayerCenterCards>
                {player.cardsInPlay
                  .filter((card) => card.type === "consumer")
                  .map((card) => (
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
              </GameBoardPlayerCenterCards>
              <GameBoardChipMenu
                label="In Transit"
                chips={[]}
                choiceProps={props.choiceProps}
                onSubmitChoice={props.onSubmitChoice}
                submitDisabled={submitDisabled}
                selectorProps={null}
                // selectorProps={
                //   someChipsSelectable(player.chipsInReserve)
                //     ? props.selectorProps
                //     : null
                // }
              />
            </GameBoardPlayerCenter>
          </GameBoardPlayerArea>
        ))}
        {observingPlayer && (
          <GameBoardPlayerArea playerIndex={observingPlayerIndex}>
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
            <GameBoardPlayerTablet playerIndex={observingPlayerIndex}>
              <GameBoardPlayerTabletHeader>
                <GameBoardPlayerTabletHeaderName
                  playerName={observingPlayer.name}
                />
                <GameBoardPlayerTabletHeaderCardArea>
                  {observingPlayer.cardsInPlay
                    .filter((card) => card.type === "producer")
                    .map((card) => (
                      <FaceUpThumbnailCard
                        key={card.id}
                        variant="inPlay"
                        card={card}
                        setDialog={props.dialogProps.set}
                        choiceProps={props.choiceProps}
                        selectorProps={
                          cardSelectEnabled(card.id)
                            ? props.selectorProps
                            : null
                        }
                      />
                    ))}
                </GameBoardPlayerTabletHeaderCardArea>
              </GameBoardPlayerTabletHeader>
              <GameBoardPlayerTabletFooter>
                <GameBoardChipMenu
                  label="In Reserve"
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
              </GameBoardPlayerTabletFooter>
            </GameBoardPlayerTablet>
            <GameBoardPlayerCenter>
              <GameBoardPlayerCenterCards>
                {observingPlayer.cardsInPlay
                  .filter((card) => card.type === "consumer")
                  .map((card) => (
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
              </GameBoardPlayerCenterCards>
              <GameBoardChipMenu
                label="In Transit"
                chips={[]}
                choiceProps={props.choiceProps}
                onSubmitChoice={props.onSubmitChoice}
                submitDisabled={submitDisabled}
                selectorProps={null}
                // selectorProps={
                //   someChipsSelectable(player.chipsInReserve)
                //     ? props.selectorProps
                //     : null
                // }
              />
            </GameBoardPlayerCenter>
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
  },
);
