/**
 * Components for composing a fullsize form factor card presentation.
 *
 * A fullsize card uses card art that leaves room for the presentation of
 * various details, such as action instructions or triggers.
 *
 * Fullsize cards tend to be presented inside of a more elaborate container
 * than thumbnail cards.
 */
import { Msg } from "@client/components/msg";
import { CardImage } from "./image";
import type { CardDefDigest, CardType } from "./types";
import "./styles.css";

/******************************************************************************
 * ### FullsizeCardContainer
 *
 * The container for all the elements displayed when a card is enlarged in a
 * dialog.
 ******************************************************************************/
const FullsizeCardContainer = (props: { children?: React.ReactNode }) => {
  return <div className="card-fullsize-container">{props.children}</div>;
};

/******************************************************************************
 * ### FullsizeCardContainerHeader
 ******************************************************************************/
const FullsizeCardContainerHeader = (props: { children: React.ReactNode }) => {
  return (
    <div className="card-fullsize-container__header">{props.children}</div>
  );
};

/******************************************************************************
 * ### FullsizeCardContainerName
 ******************************************************************************/
const FullsizeCardContainerName = (props: { children: React.ReactNode }) => {
  return <div className="card-fullsize-container__name">{props.children}</div>;
};

/******************************************************************************
 * ### FullsizeCardContainerLink
 ******************************************************************************/
const FullsizeCardContainerLink = (props: { url: string }) => {
  return (
    <div className="card-fullsize-container__link">
      <a href={props.url}>source</a>
    </div>
  );
};

/******************************************************************************
 * ### FullsizeCard
 ******************************************************************************/
const FullsizeCard = (props: {
  type: CardType;
  children?: React.ReactNode;
}) => {
  return (
    <div className={`card-fullsize card-fullsize--${props.type}`}>
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### FullsizeCardBackground
 ******************************************************************************/
const FullsizeCardBackground = (props: { children?: React.ReactNode }) => {
  return <div className="card-fullsize__background">{props.children}</div>;
};

/******************************************************************************
 * ### FullsizeCardForeground
 ******************************************************************************/
const FullsizeCardForeground = (props: { children?: React.ReactNode }) => {
  return <div className="card-fullsize__foreground">{props.children}</div>;
};

/******************************************************************************
 * ### FullsizeCardBody
 ******************************************************************************/
const FullsizeCardBody = (props: { children?: React.ReactNode }) => {
  return <div className="card-fullsize-body">{props.children}</div>;
};

/******************************************************************************
 * ### FullsizeCardTriggerInstructions
 ******************************************************************************/
const FullsizeCardTriggerInstructions = (props: {
  children?: React.ReactNode;
}) => {
  return (
    <div className="card-fullsize-body__trigger-instructions">
      {props.children}
    </div>
  );
};

/******************************************************************************
 * ### FullsizeCardActionText
 *
 * A box for text printed on the card, e.g. an action's instructions when there
 * is no game in which to take the action.
 ******************************************************************************/
const FullsizeCardActionText = (props: { children?: React.ReactNode }) => {
  return (
    <div className="card-fullsize-body__action-text">{props.children}</div>
  );
};

/******************************************************************************
 * ### FullsizeCardDisplay
 *
 * A card as it is printed, in the fullsize form factor: everything that comes
 * from the card's definition, and nothing that can be interacted with.
 *
 * Shown on its own to display a card outside of a game. Within a game,
 * `FullsizeCardFaceUp` composes this with the interactive layer, replacing the
 * printed actions with selectable ones and adding controls beneath the card.
 ******************************************************************************/
export const FullsizeCardDisplay = (props: {
  card: CardDefDigest;
  /** Replaces the printed actions, e.g. with selectable ones during a game. */
  actions?: React.ReactNode;
  /** Rendered beneath the card, e.g. counters and menus during a game. */
  children?: React.ReactNode;
}) => {
  return (
    <FullsizeCardContainer>
      <FullsizeCardContainerHeader>
        <FullsizeCardContainerName>
          <Msg value={props.card.display} />
        </FullsizeCardContainerName>
        {props.card.imageSourceUrl && (
          <FullsizeCardContainerLink url={props.card.imageSourceUrl} />
        )}
      </FullsizeCardContainerHeader>
      <FullsizeCard type={props.card.type}>
        <FullsizeCardBackground>
          <CardImage
            variant="fullsize"
            name={props.card.name}
            type={props.card.type}
            subtype={props.card.subtype?.key}
          />
        </FullsizeCardBackground>
        <FullsizeCardForeground>
          <div />
          <FullsizeCardBody>
            {props.card.triggerInstructions && (
              <FullsizeCardTriggerInstructions>
                <Msg value={props.card.triggerInstructions} />
              </FullsizeCardTriggerInstructions>
            )}
            {/* A card has at most one action of each type, so the type is a
                stable key. */}
            {props.actions ??
              props.card.actions.map((action) => (
                <FullsizeCardActionText key={action.type}>
                  <Msg value={action.instructions ?? null} />
                </FullsizeCardActionText>
              ))}
          </FullsizeCardBody>
        </FullsizeCardForeground>
      </FullsizeCard>
      {props.children}
    </FullsizeCardContainer>
  );
};
