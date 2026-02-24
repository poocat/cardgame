import { Button, Dialog, SelectButton } from "@client/components";
import { Box, Stack } from "@client/components/layout";
import type { Color } from "@client/components/types";
import type React from "react";
import { Fragment, memo, useCallback, useMemo } from "react";
import { DetailCard, FaceUpThumbnail, ThumbnailPlaceholder } from "./cards";
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
  ObserverPlayerDigest,
  OtherPlayerDigest,
  PlayerSide,
  SelectorProps,
} from "./types";

type PlayerListItem = { index: number } & (
  | { isObserver: true; player: ObserverPlayerDigest }
  | { isObserver: false; player: OtherPlayerDigest }
);
function getPlayerList(args: {
  playerOrder: string[];
  otherPlayers: OtherPlayerDigest[];
  observingPlayer?: ObserverPlayerDigest;
}): PlayerListItem[] {
  if (args.observingPlayer === undefined) {
    return args.otherPlayers.map((player, index) => ({
      player,
      index,
      isObserver: false,
    }));
  } else {
    const observerIndex = args.playerOrder.indexOf(args.observingPlayer.id);
    const playerList: PlayerListItem[] = [];
    const numPlayers = args.playerOrder.length;
    for (let i = 1; i < numPlayers; i++) {
      const index = (observerIndex + i) % numPlayers;
      const playerId = args.playerOrder[index];
      const player = args.otherPlayers.find((p) => p.id === playerId);
      if (player) {
        playerList.push({ index, player, isObserver: false });
      }
    }
    playerList.push({
      index: observerIndex,
      player: args.observingPlayer,
      isObserver: true,
    });
    return playerList;
  }
}

function getPlayerSide(playerIndex: number): PlayerSide {
  return playerIndex % 2 > 0 ? "right" : "left";
}

/******************************************************************************
 * ### GameBoardContainer
 ******************************************************************************/
const GameBoardContainer = (props: { children?: React.ReactNode }) => {
  return (
    <div className={`game game-container`}>
      <div className="game-background">
        <div className={`game-background__cutout`}></div>
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
  side: PlayerSide;
  children: React.ReactNode;
}) => {
  const className = `game-player-area game-player-area--side-${props.side}`;
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerTablet
 ******************************************************************************/
const GameBoardPlayerTablet = (props: {
  index: number;
  children: React.ReactNode;
}) => {
  const className = `game-player-tablet game-player-tablet--player-${props.index}`;
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerTabletHeader
 ******************************************************************************/
const GameBoardPlayerTabletHeader = (props: {
  playerName: string;
  playerOnTurn: boolean;
}) => {
  return (
    <div className="game-player-tablet__header">
      <div className="game-player-tablet__name">{props.playerName}</div>
      {props.playerOnTurn && <div className="game-player-tablet__indicator" />}
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerTabletHeaderCardArea
 ******************************************************************************/
const GameBoardPlayerTabletCardArea = (props: {
  children: React.ReactNode;
}) => {
  return (
    <div className="game-player-tablet__body">
      <div className="game-player-tablet__card-area">{props.children}</div>
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerTabletFooter
 ******************************************************************************/
const GameBoardPlayerTabletFooter = (props: { children: React.ReactNode }) => {
  return <div className="game-player-tablet__footer">{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerAbutment
 *
 * An area that is attached to the bottom edge of the player area, used to
 * hold representations of other players' hands, discard areas, et cetera.
 *
 * For the
 ******************************************************************************/
const GameBoardPlayerAbutment = (props: { children?: React.ReactNode }) => {
  return <div className={`game-player-abutment`}>{props.children}</div>;
};

/******************************************************************************
 * ### GameBoardPlayerHand
 *
 * Only used for the observing player at the bottom of the game board.
 ******************************************************************************/
const GameBoardPlayerHand = (props: {
  side: PlayerSide;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={`game-player-hand-container game-player-hand-container--side-${props.side}`}
    >
      <div className={`game-player-hand game-player-hand--side-${props.side}`}>
        {props.children}
      </div>
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerCenter
 ******************************************************************************/
const GameBoardPlayerCenter = (props: {
  side: PlayerSide;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={`game-player-center game-player-center--side-${props.side}`}
    >
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerCenter
 ******************************************************************************/
const GameBoardPlayerCenterCards = (props: {
  side: PlayerSide;
  children?: React.ReactNode;
}) => {
  return <div className="game-player-center__card-area">{props.children}</div>;
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
    inverted: boolean;
    side: PlayerSide;
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

    const selecting =
      props.selectorProps !== null && selectableChipIds.length > 0;

    return (
      <ChipArea inverted={props.inverted} side={props.side}>
        <ChipAreaLabel>{props.label}</ChipAreaLabel>
        <ChipDisplay
          inverted={props.inverted}
          side={props.side}
          fullWidth={selecting}
        >
          <ChipDisplayCounter
            size="md"
            baseCount={props.chips.length}
            selectedCount={numSelected}
          />
          {selecting && (
            <ChipDisplaySelector
              size="md"
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
        <Box spacing="sm">
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
        </Box>
      </div>
    );
  },
);

/******************************************************************************
 * ### GameOverMenu
 ******************************************************************************/
const GameOverMenu = (props: { winnerName: string }) => {
  return (
    <div className="game-footer-menu">
      <Box spacing="lg">{props.winnerName} wins!</Box>
    </div>
  );
};

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
    const gameOver = props.game.winner !== null;
    const observingPlayer = props.game.observingPlayer;
    const choosingPlayerId = props.game.activity.choice.choosingPlayerId;
    const observingPlayerIsChoosing =
      observingPlayer?.id === choosingPlayerId && !gameOver;
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

    const playerList = getPlayerList({
      playerOrder: props.game.playerOrder,
      observingPlayer: props.game.observingPlayer,
      otherPlayers: props.game.otherPlayers,
    });

    return (
      <GameBoardContainer>
        {playerList.map(({ player, isObserver, index }) => {
          const side = getPlayerSide(index);
          const onTurn = props.game.playerTakingTurnId === player.id;
          return (
            <Fragment key={player.id}>
              <GameBoardPlayerArea side={side}>
                {/* Abutment not displayed for observing player. */}
                {!isObserver && (
                  <GameBoardPlayerAbutment>
                    <ThumbnailPlaceholder highlight="none">
                      <div>
                        <div>Hand</div>
                        <div>{player.cardsInHand.length}</div>
                      </div>
                    </ThumbnailPlaceholder>
                  </GameBoardPlayerAbutment>
                )}
                <GameBoardPlayerTablet index={index}>
                  <GameBoardPlayerTabletHeader
                    playerName={player.name}
                    playerOnTurn={onTurn}
                  />
                  <GameBoardPlayerTabletCardArea>
                    {player.cardsInPlay
                      .filter((card) => card.type === "producer")
                      .map((card) => (
                        <FaceUpThumbnail
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
                  </GameBoardPlayerTabletCardArea>
                  <GameBoardPlayerTabletFooter>
                    <GameBoardChipMenu
                      label="In Reserve"
                      inverted={false}
                      side={side}
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
                <GameBoardPlayerCenter side={side}>
                  <GameBoardPlayerCenterCards side={side}>
                    {player.cardsInPlay
                      .filter((card) => card.type === "consumer")
                      .map((card) => (
                        <FaceUpThumbnail
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
                  </GameBoardPlayerCenterCards>
                  <GameBoardChipMenu
                    label="In Channel"
                    inverted={true}
                    side={side}
                    chips={player.chipsinChannel}
                    choiceProps={props.choiceProps}
                    onSubmitChoice={props.onSubmitChoice}
                    submitDisabled={submitDisabled}
                    selectorProps={
                      someChipsSelectable(player.chipsinChannel)
                        ? props.selectorProps
                        : null
                    }
                  />
                </GameBoardPlayerCenter>
              </GameBoardPlayerArea>
              {/* Face-up hand only displayed for observer player. */}
              {isObserver && (
                <GameBoardPlayerHand side={side}>
                  {player.cardsInHand.map((card) => (
                    <FaceUpThumbnail
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
                </GameBoardPlayerHand>
              )}
            </Fragment>
          );
        })}
        {observingPlayer === undefined ? (
          <div className="game-player-abutment-spacer" />
        ) : (
          // Always leave room for the footer menu if there is an observing player.
          <div className="game-footer-spacer" />
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
        {gameOver && (
          <GameOverMenu winnerName={props.game.winner?.name ?? ""} />
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
