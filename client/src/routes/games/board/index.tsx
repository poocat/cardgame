import { Button, Dialog, SelectButton } from "@client/components";
import type { gameDigestSchema } from "@common/api/digests";
import type { choiceTypes } from "@common/game/enums";
import type z from "zod";
import { DetailCard, FaceUpThumbnailCard } from "./cards";
import { ChipSelectMenu, DetailChipCounter, useChipSelector } from "./chips";
import { colors } from "./colors";
import { useChoice, useDialog, useSubmit, useValueSelect } from "./contexts";

type ChoiceType = (typeof choiceTypes)[number];
type GameDigest = z.infer<typeof gameDigestSchema>;

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
const GameBoardPlayerChipContainerMenu = (props: { chipIds: string[] }) => {
  const choice = useChoice();

  const selectableChips = props.chipIds.filter((chipId) =>
    choice.checkValue(chipId),
  );

  const { numSelected, moreAllowed, addChip, removeChip } = useChipSelector({
    chipIds: props.chipIds,
  });

  const { submit, canSubmit } = useSubmit();

  return (
    <>
      <DetailChipCounter
        count={props.chipIds.length}
        numSelected={numSelected}
      />
      {choice.forObserver && selectableChips.length > 0 && (
        <ChipSelectMenu
          numSelected={numSelected}
          onIncrement={addChip}
          onDecrement={removeChip}
          onSubmit={submit}
          disableIncrement={!moreAllowed}
          disableSubmit={!canSubmit}
        />
      )}
    </>
  );
};

/******************************************************************************
 * ### GameBoardChoiceMenuValueSelect
 *
 * TODO!!! Memoize?
 ******************************************************************************/
const GameBoardChoiceMenuValueSelect = (props: {
  choiceType: ChoiceType;
  value: string;
  label: string;
}) => {
  const { value, label } = props;
  const { selected, disabled, toggle } = useValueSelect(value);

  let color = colors.board.alpha(1);
  switch (props.choiceType) {
    case "actionId":
      color = colors.actions.alpha(0.8);
      break;
    case "cardId":
      color = colors.cards.alpha(0.8);
      break;
    case "chipId":
      color = colors.chips.alpha(0.8);
      break;
  }

  return (
    <SelectButton
      label={label}
      disabled={disabled}
      selected={selected}
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
const GameBoardChoiceMenu = (props: {
  instructions: string;
  choiceType: ChoiceType;
  values: { value: string; label: string }[];
}) => {
  const { submit, canSubmit } = useSubmit();

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
            color={colors.board.alpha(1)}
            disabled={!canSubmit}
            onClick={submit}
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
          {props.values.map(({ value, label }) => (
            <GameBoardChoiceMenuValueSelect
              key={value}
              value={value}
              label={label}
              choiceType={props.choiceType}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/******************************************************************************
 * ### GameBoard
 ******************************************************************************/
export const GameBoard = (props: { game: GameDigest }) => {
  const observingPlayer = props.game.observingPlayer;
  const choosingPlayerId = props.game.activity.choice.choosingPlayerId;
  const observingPlayerIsChoosing = observingPlayer?.id === choosingPlayerId;

  const dialog = useDialog();

  return (
    <GameBoardContainer>
      {props.game.otherPlayers.map((player) => (
        <GameBoardPlayerArea key={player.id}>
          <hr />
          <GameBoardPlayerHeader playerName={player.name} />
          <GameBoardPlayerPlayArea>
            {player.cardsInPlay.map((card) => (
              <FaceUpThumbnailCard key={card.id} variant="inPlay" card={card} />
            ))}
          </GameBoardPlayerPlayArea>
          <GameBoardPlayerChipContainer>
            <GameBoardPlayerChipContainerHeading>
              Reserve
            </GameBoardPlayerChipContainerHeading>
            <GameBoardPlayerChipContainerBody>
              <GameBoardPlayerChipContainerMenu
                chipIds={player.chipsInReserve.map(({ id }) => id)}
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
              <FaceUpThumbnailCard key={card.id} variant="inPlay" card={card} />
            ))}
          </GameBoardPlayerPlayArea>
          <GameBoardPlayerChipContainer>
            <GameBoardPlayerChipContainerHeading>
              Reserve
            </GameBoardPlayerChipContainerHeading>
            <GameBoardPlayerChipContainerBody>
              <GameBoardPlayerChipContainerMenu
                chipIds={observingPlayer.chipsInReserve.map(({ id }) => id)}
              />
            </GameBoardPlayerChipContainerBody>
          </GameBoardPlayerChipContainer>
          <GameBoardPlayerHandArea>
            {observingPlayer.cardsInHand.map((card) => (
              <FaceUpThumbnailCard key={card.id} variant="inHand" card={card} />
            ))}
          </GameBoardPlayerHandArea>
        </GameBoardPlayerArea>
      )}
      {observingPlayerIsChoosing && (
        <GameBoardChoiceMenu
          instructions={props.game.activity.choice.instructions}
          choiceType={props.game.activity.choice.type}
          values={props.game.activity.choice.values.map(({ value }) => ({
            value,
            label: value,
          }))}
        />
      )}
      <GameBoardFooter />
      <Dialog isOpen={dialog.isOpen} onClose={dialog.close}>
        {dialog.value?.type === "card" && (
          <DetailCard card={dialog.value.card} />
        )}
      </Dialog>
    </GameBoardContainer>
  );
};
