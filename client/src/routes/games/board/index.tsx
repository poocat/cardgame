import { Dialog } from "@client/components";
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
import {
  ChoiceMenu,
  ExplanationMenu,
  GameOverMenu,
  MenuContainer,
} from "./menu";
import {
  ObservingPlayerHand,
  PlayerAbutment,
  PlayerArea,
  PlayerCenter,
  PlayerCenterCardArea,
  PlayerTablet,
  PlayerTabletCardArea,
  PlayerTabletFooter,
  PlayerTabletHeader,
} from "./player";
import "./styles.css";
import type {
  ChipDigest,
  ChoiceProps,
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
              <PlayerArea side={side}>
                {/* Abutment not displayed for observing player. */}
                {!isObserver && (
                  <PlayerAbutment>
                    <ThumbnailPlaceholder highlight="none">
                      <div>
                        <div>Hand</div>
                        <div>{player.cardsInHand.length}</div>
                      </div>
                    </ThumbnailPlaceholder>
                  </PlayerAbutment>
                )}
                <PlayerTablet index={index}>
                  <PlayerTabletHeader
                    playerName={player.name}
                    playerOnTurn={onTurn}
                  />
                  <PlayerTabletCardArea>
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
                  </PlayerTabletCardArea>
                  <PlayerTabletFooter>
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
                  </PlayerTabletFooter>
                </PlayerTablet>
                <PlayerCenter side={side}>
                  <PlayerCenterCardArea side={side}>
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
                  </PlayerCenterCardArea>
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
                </PlayerCenter>
              </PlayerArea>
              {/* Face-up hand only displayed for observer player. */}
              {isObserver && (
                <ObservingPlayerHand side={side}>
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
                </ObservingPlayerHand>
              )}
            </Fragment>
          );
        })}
        {observingPlayer === undefined && (
          <div className="game-player-abutment-spacer" />
        )}
        <MenuContainer>
          {gameOver ? (
            <GameOverMenu winnerName={props.game.winner?.name ?? ""} />
          ) : observingPlayerIsChoosing ? (
            <ChoiceMenu
              instructions={props.game.activity.choice.instructions}
              choiceType={props.game.activity.choice.type}
              values={props.game.activity.choice.values}
              onSubmitChoice={props.onSubmitChoice}
              submitDisabled={submitDisabled}
              toggleValue={props.selectorProps.toggleValue}
              checkValueSelected={props.selectorProps.checkValueSelected}
              moreValuesAllowed={props.selectorProps.moreValuesAllowed}
            />
          ) : (
            <ExplanationMenu explanation={props.game.activity.explanation} />
          )}
        </MenuContainer>
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
