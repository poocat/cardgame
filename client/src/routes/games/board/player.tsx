import { Icon } from "@client/components/icon";
import { Msg } from "@client/components/msg";
import type { PlayerSide } from "./types";

/******************************************************************************
 * ### Labeled
 ******************************************************************************/
export const Labeled = (props: {
  side: PlayerSide;
  msgKey: string;
  iconKey?: string;
  children: React.ReactNode;
}) => {
  const className = `game-label game-label--side-${props.side}`;
  const msg = <Msg value={{ key: props.msgKey }} textOnly />;
  const icon = props.iconKey && <Icon msgKey={props.iconKey} decorative />;
  const content = props.side === "left" ? [icon, msg] : [msg, icon];
  return (
    <div className={className}>
      <span className="game-label__content">{content}</span>
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### PlayerSection
 *
 * A row spanning the width of the UI, used to lay out all of a player's cards,
 * chips, et cetera.
 ******************************************************************************/
export const PlayerSection = (props: {
  side: PlayerSide;
  children: React.ReactNode;
}) => {
  const className = `game-player-section game-player-section--side-${props.side}`;
  return <section className={className}>{props.children}</section>;
};

/******************************************************************************
 * ### PlayerTablet
 *
 * A color-coded box used to lay out the player's name, producer cards, reserve
 * chips, et cetera.
 ******************************************************************************/
export const PlayerTablet = (props: {
  side: PlayerSide;
  /** Player color is mapped to their index. */
  playerIndex: number;
  children: React.ReactNode;
}) => {
  const className = `game-player-tablet game-player-tablet--side-${props.side} game-player-tablet--player-${props.playerIndex}`;
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### PlayerTabletHeader
 *
 * Used as a child of `<PlayerTablet/>` to display data and controls at the
 * top of the tablet.
 ******************************************************************************/
export const PlayerTabletHeader = (props: {
  side: PlayerSide;
  children: React.ReactNode;
}) => {
  const className = `game-player-tablet__header game-player-tablet__header--side-${props.side}`;
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### PlayerTabletIdentity
 *
 * Used to display the player's name and optional subtitles indi.
 ******************************************************************************/
export const PlayerTabletIdentity = (props: {
  playerTitle: string;
  playerOnTurn: boolean;
}) => {
  return (
    <div className="game-player-tablet-identity">
      <h2 aria-label={props.playerTitle}>
        {props.playerTitle}
        {props.playerOnTurn && (
          <span className="game-player-tablet-identity__on-turn-indicator"></span>
        )}
      </h2>
    </div>
  );
};

/******************************************************************************
 * ### PlayerTabletPiles
 *
 * Use as a child of `<PlayerTabletHeader/>` to display the player's discard
 * pile and (if not the observing player) their hand.
 ******************************************************************************/
export const PlayerTabletPiles = (props: {
  side: PlayerSide;
  children: React.ReactNode;
}) => {
  const className = `game-player-tablet-piles game-player-tablet-piles--side-${props.side}`;
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### PlayerTabletProducers
 *
 * Used as a child of `<PlayerTablet/>` to display an array the player's
 * producer cards.
 ******************************************************************************/
export const PlayerTabletProducers = (props: {
  side: PlayerSide;
  children: React.ReactNode;
}) => {
  const className = `game-player-tablet__producers game-player-tablet__producers--side-${props.side}`;
  return (
    <Labeled side={props.side} msgKey="term.producers" iconKey="term.producer">
      <div className={className}>{props.children}</div>
    </Labeled>
  );
};

/******************************************************************************
 * ### PlayerMind
 *
 * Used as the second child of `<PlayerSection/>` after `<PlayerTablet/>` to
 * display a player's consumer cards and chips in their channel.
 ******************************************************************************/
export const PlayerMind = (props: { children?: React.ReactNode }) => {
  return <div className={`game-player-mind`}>{props.children}</div>;
};

/******************************************************************************
 * ### PlayerMindConsumers
 *
 * Used as a child of `<PlayerMind/>` to display a player's consumer cards.
 ******************************************************************************/
export const PlayerMindConsumers = (props: {
  side: PlayerSide;
  children?: React.ReactNode;
}) => {
  const className = `game-player-mind__consumers game-player-mind__consumers--side-${props.side}`;
  return (
    <Labeled side={props.side} msgKey="term.consumers" iconKey="term.consumer">
      <div className={className}>{props.children}</div>
    </Labeled>
  );
};

/******************************************************************************
 * ### PlayerHand
 *
 * A container for the face-up cards in the observing player's hand.
 ******************************************************************************/
export const PlayerDashboard = (props: {
  side: PlayerSide;
  children?: React.ReactNode;
}) => {
  const className = `game-player-dashboard game-player-dashboard--side-${props.side}`;
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### PlayerHand
 *
 * A container for the face-up cards in the observing player's hand.
 ******************************************************************************/
export const PlayerDashboardHand = (props: {
  side: PlayerSide;
  children?: React.ReactNode;
}) => {
  const className = `game-player-dashboard__hand game-player-dashboard__hand--side-${props.side}`;
  return <div className={className}>{props.children}</div>;
};
