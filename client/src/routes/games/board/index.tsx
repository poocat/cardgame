import type { gameDigestSchema } from "@common/api/digests";
import type { CSSProperties } from "react";
import type z from "zod";
import { FaceUpCard } from "./cards";
import { thumbnailCardBorderWidth } from "./cards/thumbnails/constants";

type GameDigest = z.infer<typeof gameDigestSchema>;

const floatingDialogHeight = 100;

const cardArrayStyleProps: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  // Setting the gap equal to the border width ensures that they overlap perfectly.
  gap: thumbnailCardBorderWidth,
};

/******************************************************************************
 * ### GameBoardContainer
 ******************************************************************************/
const GameBoardContainer = (props: { children?: React.ReactNode }) => {
  return <div style={{ width: "100%" }}>{props.children}</div>;
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
    <div style={{ width: "100%", height: floatingDialogHeight }}>
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

const GameBoardPlayerHeader = (props: { playerName: string }) => {
  return (
    <div>
      <h2>{props.playerName}</h2>
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerHandArea
 ******************************************************************************/
const GameBoardPlayerHandArea = (props: { children?: React.ReactNode }) => {
  return (
    <div>
      <h4>Cards in Hand:</h4>
      <div style={{ ...cardArrayStyleProps }}>{props.children}</div>
    </div>
  );
};

/******************************************************************************
 * ### GameBoardPlayerPlayArea
 ******************************************************************************/
const GameBoardPlayerPlayArea = (props: { children?: React.ReactNode }) => {
  return (
    <div>
      <h4>Cards in Play:</h4>
      <div style={{ ...cardArrayStyleProps }}>{props.children}</div>
    </div>
  );
};

/******************************************************************************
 * ### GameBoard
 ******************************************************************************/
export const GameBoard = (props: { game: GameDigest }) => {
  const observingPlayer = props.game.observingPlayer;

  return (
    <GameBoardContainer>
      {props.game.otherPlayers.map((player) => (
        <GameBoardPlayerArea key={player.id}>
          <GameBoardPlayerHeader playerName={player.name} />
          <GameBoardPlayerPlayArea>
            {player.cardsInPlay.map((card) => (
              <FaceUpCard key={card.id} variant="inPlay" card={card} />
            ))}
          </GameBoardPlayerPlayArea>
        </GameBoardPlayerArea>
      ))}
      {observingPlayer && (
        <GameBoardPlayerArea>
          <GameBoardPlayerHeader playerName={observingPlayer.name} />
          <GameBoardPlayerHandArea>
            {observingPlayer.cardsInHand.map((card) => (
              <FaceUpCard key={card.id} variant="inHand" card={card} />
            ))}
          </GameBoardPlayerHandArea>
          <GameBoardPlayerPlayArea>
            {observingPlayer.cardsInPlay.map((card) => (
              <FaceUpCard key={card.id} variant="inPlay" card={card} />
            ))}
          </GameBoardPlayerPlayArea>
        </GameBoardPlayerArea>
      )}
      <GameBoardFooter />
    </GameBoardContainer>
  );
};
