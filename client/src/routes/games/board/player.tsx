import { Icon } from "@client/components/icon";
import { Msg } from "@client/components/msg";
import { msg } from "@common/text/messages";
import type { Message, PlayerSide } from "./types";

/******************************************************************************
 * ### Labeled
 *
 * The icon/text order and the text alignment both follow the inherited
 * `direction` of the enclosing player section, so this does not need to know
 * which side of the board it is on.
 ******************************************************************************/
export const Labeled = (props: {
  text: Message;
  icon?: Message;
  children: React.ReactNode;
}) => {
  return (
    <div className="game-label">
      <span className="game-label__content">
        {props.icon && <Icon msg={props.icon} decorative />}
        <Msg value={props.text} textOnly />
      </span>
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
  /** Player color is mapped to their index. */
  playerIndex: number;
  children: React.ReactNode;
}) => {
  const className = `game-player-tablet game-player-tablet--player-${props.playerIndex}`;
  return <div className={className}>{props.children}</div>;
};

/******************************************************************************
 * ### PlayerTabletHeader
 *
 * Used as a child of `<PlayerTablet/>` to display data and controls at the
 * top of the tablet.
 ******************************************************************************/
export const PlayerTabletHeader = (props: { children: React.ReactNode }) => {
  return <div className="game-player-tablet__header">{props.children}</div>;
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
      <h2>
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
export const PlayerTabletPiles = (props: { children: React.ReactNode }) => {
  return <div className="game-player-tablet-piles">{props.children}</div>;
};

/******************************************************************************
 * ### PlayerTabletProducers
 *
 * Used as a child of `<PlayerTablet/>` to display an array the player's
 * producer cards.
 ******************************************************************************/
export const PlayerTabletProducers = (props: { children: React.ReactNode }) => {
  return (
    <Labeled
      text={msg("card.group.producers")}
      icon={msg("card.type.producer")}
    >
      <div className="game-player-tablet__producers">{props.children}</div>
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
export const PlayerMindConsumers = (props: { children?: React.ReactNode }) => {
  return (
    <Labeled
      text={msg("card.group.consumers")}
      icon={msg("card.type.consumer")}
    >
      <div className="game-player-mind__consumers">{props.children}</div>
    </Labeled>
  );
};

/******************************************************************************
 * ### PlayerHand
 *
 * A container for the face-up cards in the observing player's hand.
 ******************************************************************************/
export const PlayerDashboard = (props: { children?: React.ReactNode }) => {
  return <div className="game-player-dashboard">{props.children}</div>;
};

/******************************************************************************
 * ### PlayerHand
 *
 * A container for the face-up cards in the observing player's hand.
 ******************************************************************************/
export const PlayerDashboardHand = (props: { children?: React.ReactNode }) => {
  return <div className="game-player-dashboard__hand">{props.children}</div>;
};
