import type { PlayerSide } from "./types";

/******************************************************************************
 * ### PlayerArea
 *
 * A row spanning the width of the UI, used to lay out all of a player's cards,
 * chips, et cetera.
 ******************************************************************************/
export const PlayerArea = (props: {
  side: PlayerSide;
  children: React.ReactNode;
}) => {
  const className = `game-player-area game-player-area--side-${props.side}`;
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### PlayerAbutment
 *
 * Used as a child of `<PlayerArea/>` to display information about other
 * players e.g. how many cards are in their hand.
 ******************************************************************************/
export const PlayerAbutment = (props: { children?: React.ReactNode }) => {
  return <div className={`game-player-abutment`}>{props.children}</div>;
};

/******************************************************************************
 * ### PlayerTablet
 *
 * A color-coded box used to lay out the player's name, producer cards, and
 * reserve chips.
 ******************************************************************************/
export const PlayerTablet = (props: {
  index: number;
  children: React.ReactNode;
}) => {
  const className = `game-player-tablet game-player-tablet--player-${props.index}`;
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### PlayerTabletHeader
 *
 * Used as a child of `<PlayerTablet/>` to display the player's name, and an
 * indicator of whether or not the player is currently taking their turn.
 ******************************************************************************/
export const PlayerTabletHeader = (props: {
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
 * ### PlayerTabletCardArea
 *
 * Used as a child of `<PlayerTablet/>` to display a player's producer cards.
 ******************************************************************************/
export const PlayerTabletCardArea = (props: { children: React.ReactNode }) => {
  return (
    <div className="game-player-tablet__body">
      <div className="game-player-tablet__card-stack">{props.children}</div>
    </div>
  );
};

/******************************************************************************
 * ### PlayerTabletFooter
 *
 * Used as a child of `<PlayerTablet/>` to display a player's reserve chips.
 ******************************************************************************/
export const PlayerTabletFooter = (props: { children: React.ReactNode }) => {
  return <div className="game-player-tablet__footer">{props.children}</div>;
};

/******************************************************************************
 * ### PlayerCenter
 *
 * Used as the second child of `<PlayerArea/>` after `<PlayerTablet/>` to
 * display a player's consumer cards and chips in their channel.
 ******************************************************************************/
export const PlayerCenter = (props: {
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
 * ### PlayerCenterCardArea
 *
 * Used as a child of `<PlayerCenter/>` to display a player's consumer cards.
 ******************************************************************************/
export const PlayerCenterCardArea = (props: {
  side: PlayerSide;
  children?: React.ReactNode;
}) => {
  return <div className="game-player-center__card-stack">{props.children}</div>;
};

/******************************************************************************
 * ### ObservingPlayerHand
 *
 * Used at the bottom of the UI to display the cards in the observing player's
 * hand.
 ******************************************************************************/
export const ObservingPlayerHand = (props: {
  side: PlayerSide;
  children?: React.ReactNode;
}) => {
  return (
    <div className={`game-player-hand game-player-hand--side-${props.side}`}>
      <div className="game-player-hand__card-stack">{props.children}</div>
    </div>
  );
};
