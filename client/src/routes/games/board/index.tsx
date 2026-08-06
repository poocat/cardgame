import { Box, Dialog, Stack } from "@client/components";
import { CONSTANTS } from "@common/game/constants";
import type React from "react";
import { Fragment, memo, useCallback, useMemo } from "react";
import {
  DiscardPile,
  FullsizeCardFaceUp,
  HandPile,
  ThumbnailCardFaceUp,
  ThumbnailCardPlaceholder,
} from "./cards";
import {
  ChipCounter,
  ChipPoolContainer,
  ChipPoolDisplay,
  ChipPoolLabel,
  ChipSelector,
  useChipSelector,
} from "./chips";
import {
  ChoiceMenu,
  ExplanationMenu,
  GameOverMenu,
  MenuContainer,
} from "./menu";
import {
  PlayerAbutment,
  PlayerArea,
  PlayerCenter,
  PlayerCenterCardArea,
  PlayerDashboard,
  PlayerHand,
  PlayerTablet,
  PlayerTabletCardArea,
  PlayerTabletFooter,
  PlayerTabletHeader,
} from "./player";
import type { RematchProps } from "./rematch";
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

/******************************************************************************
 * ### getPlayerList
 *
 * Order the player data such that the observing player is always last, the
 * player after them is always at the top, and the remaining players are
 * between them in play order.
 *
 * This ensures that the player's cards and controls can always be found at
 * the bottom of the game board.
 ******************************************************************************/
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

function range(n: number): number[] {
  return [...Array(n).keys()];
}

/******************************************************************************
 * ### GameBoardContainer
 ******************************************************************************/
const GameBoardContainer = (props: { children?: React.ReactNode }) => {
  return (
    <div className="game-container">
      <div className="game-background">
        <div className={`game-background__cutout`}></div>
      </div>
      <div className="game-foreground">
        <div className="game-foreground__headspace"></div>
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
const ChipPool = memo(
  (props: {
    label: string;
    light: boolean;
    side: PlayerSide;
    chips: ChipDigest[];
    submitDisabled: boolean;
    submitting: boolean;
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
      <ChipPoolContainer light={props.light} side={props.side}>
        <ChipPoolLabel>{props.label}</ChipPoolLabel>
        <ChipPoolDisplay
          light={props.light}
          side={props.side}
          fullWidth={selecting}
        >
          <ChipCounter
            size="md"
            light={props.light}
            side={props.side}
            baseCount={props.chips.length}
            selectedCount={numSelected}
          />
          {selecting && (
            <ChipSelector
              size="md"
              light={props.light}
              numSelected={numSelected}
              onIncrement={addChip}
              onDecrement={removeChip}
              submitting={props.submitting}
              disableSubmit={props.submitDisabled}
              disableIncrement={!props.selectorProps?.moreValuesAllowed}
            />
          )}
        </ChipPoolDisplay>
      </ChipPoolContainer>
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
    submitting: boolean;
    dialogProps: DialogProps;
    selectorProps: SelectorProps;
    choiceProps: ChoiceProps;
    rematchProps: RematchProps;
    errors: string[];
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

    // Compose the label for the submit button, indicating when doing so wioll
    // end the player's turn.
    const submitLabel = useMemo(() => {
      const numSelectedValues = props.selectorProps.selectedValues.length;
      if (
        props.game.activity.type === "choosingAction" &&
        numSelectedValues === 0
      ) {
        return "End Turn";
      }
      return `Submit ${numSelectedValues} Choice(s)`;
    }, [props.game.activity.type, props.selectorProps.selectedValues.length]);

    const playerList = getPlayerList({
      playerOrder: props.game.playerOrder,
      observingPlayer: props.game.observingPlayer,
      otherPlayers: props.game.otherPlayers,
    });

    return (
      <GameBoardContainer>
        {playerList.map(({ player, isObserver, index }, i) => {
          const side = getPlayerSide(i);
          const onTurn = props.game.playerTakingTurnId === player.id;
          const producersInPlay = player.cardsInPlay.filter(
            (card) => card.type === "producer",
          );
          const consumersInPlay = player.cardsInPlay.filter(
            (card) => card.type === "consumer",
          );
          const numProducerPlaceholders =
            CONSTANTS.maxNumProducersInPlay - producersInPlay.length;
          return (
            <Fragment key={player.id}>
              <PlayerArea side={side}>
                {/* Abutment not displayed for observing player. */}
                {!isObserver && (
                  <PlayerAbutment>
                    <DiscardPile
                      cardsVisible={player.cardsInDiscardVisible}
                      totalCount={player.cardsInDiscard.length}
                      setDialog={props.dialogProps.set}
                    />
                    <HandPile count={player.cardsInHand.length} />
                  </PlayerAbutment>
                )}
                <PlayerTablet index={index}>
                  <PlayerTabletHeader
                    playerName={player.name}
                    playerOnTurn={onTurn}
                  />
                  <PlayerTabletCardArea>
                    {producersInPlay.map((card) => (
                      <ThumbnailCardFaceUp
                        key={card.id}
                        variant="inPlay"
                        card={card}
                        setDialog={props.dialogProps.set}
                        choiceProps={props.choiceProps}
                        submitting={props.submitting}
                        selectorProps={
                          cardSelectEnabled(card.id)
                            ? props.selectorProps
                            : null
                        }
                      />
                    ))}
                    {range(numProducerPlaceholders).map((i) => (
                      <ThumbnailCardPlaceholder key={i} />
                    ))}
                  </PlayerTabletCardArea>
                  <PlayerTabletFooter>
                    <ChipPool
                      label="In Reserve"
                      light={false}
                      side={side}
                      chips={player.chipsInReserve}
                      choiceProps={props.choiceProps}
                      onSubmitChoice={props.onSubmitChoice}
                      submitDisabled={submitDisabled}
                      submitting={props.submitting}
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
                    {consumersInPlay.map((card) => (
                      <ThumbnailCardFaceUp
                        key={card.id}
                        variant="inPlay"
                        card={card}
                        setDialog={props.dialogProps.set}
                        choiceProps={props.choiceProps}
                        submitting={props.submitting}
                        selectorProps={
                          cardSelectEnabled(card.id)
                            ? props.selectorProps
                            : null
                        }
                      />
                    ))}
                  </PlayerCenterCardArea>
                  <ChipPool
                    label="In Channel"
                    light={true}
                    side={side}
                    chips={player.chipsinChannel}
                    choiceProps={props.choiceProps}
                    onSubmitChoice={props.onSubmitChoice}
                    submitDisabled={submitDisabled}
                    submitting={props.submitting}
                    selectorProps={
                      someChipsSelectable(player.chipsinChannel)
                        ? props.selectorProps
                        : null
                    }
                  />
                </PlayerCenter>
              </PlayerArea>
              {isObserver && (
                <PlayerDashboard side={side}>
                  <PlayerHand>
                    {player.cardsInHand.map((card) => (
                      <ThumbnailCardFaceUp
                        key={card.id}
                        variant="inHand"
                        card={card}
                        setDialog={props.dialogProps.set}
                        choiceProps={props.choiceProps}
                        submitting={props.submitting}
                        selectorProps={
                          cardSelectEnabled(card.id)
                            ? props.selectorProps
                            : null
                        }
                      />
                    ))}
                  </PlayerHand>
                  <DiscardPile
                    cardsVisible={player.cardsInDiscardVisible}
                    totalCount={player.cardsInDiscard.length}
                    setDialog={props.dialogProps.set}
                  />
                </PlayerDashboard>
              )}
            </Fragment>
          );
        })}
        {!observingPlayer && <div className="game-player-abutment-spacer" />}
        <MenuContainer>
          {gameOver ? (
            <GameOverMenu
              winnerName={props.game.winner?.name ?? ""}
              rematchProps={props.rematchProps}
            />
          ) : observingPlayerIsChoosing ? (
            <ChoiceMenu
              submitLabel={submitLabel}
              instructions={props.game.activity.choice.instructions}
              choiceType={props.game.activity.choice.type}
              values={props.game.activity.choice.values}
              onSubmitChoice={props.onSubmitChoice}
              submitDisabled={submitDisabled}
              submitting={props.submitting}
              toggleValue={props.selectorProps.toggleValue}
              checkValueSelected={props.selectorProps.checkValueSelected}
              moreValuesAllowed={props.selectorProps.moreValuesAllowed}
            />
          ) : (
            <ExplanationMenu explanation={props.game.activity.explanation} />
          )}
          {props.errors.length > 0 && (
            <Stack orientation="vertical" spacing="sm">
              {props.errors.map((msg) => (
                <Box key={msg} fullWidth spacing="lg" color="error">
                  {msg}
                </Box>
              ))}
            </Stack>
          )}
        </MenuContainer>
        <Dialog
          title={dialogTitle}
          description=""
          isOpen={props.dialogProps.isOpen}
          onClose={props.dialogProps.close}
        >
          {props.dialogProps.value?.type === "card" && (
            <FullsizeCardFaceUp
              card={props.dialogProps.value.card}
              onSubmitChoice={props.onSubmitChoice}
              submitDisabled={submitDisabled}
              submitting={props.submitting}
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
