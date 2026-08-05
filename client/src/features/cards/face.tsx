import { Msg } from "@client/components/msg";
import {
  CardDetailActions,
  CardDetailBackground,
  CardDetailBody,
  CardDetailContainer,
  CardDetailForeground,
  CardDetailHeader,
  CardDetailLink,
  CardDetailName,
  CardDetailTextBox,
  CardDetailTriggerInstructions,
} from "./detail";
import { CardImage } from "./image";
import "./styles.css";
import type { CardDefDigest } from "./types";

/******************************************************************************
 * ### CardFace
 *
 * A card as it is printed, in the "detail" form factor: everything that comes
 * from the card's definition, and nothing that can be interacted with.
 *
 * Shown on its own to display a card outside of a game. Within a game,
 * `DetailCard` composes this with the interactive layer, replacing the printed
 * actions with selectable ones and adding controls beneath the card.
 ******************************************************************************/
export const CardFace = (props: {
  card: CardDefDigest;
  /** Replaces the printed actions, e.g. with selectable ones during a game. */
  actions?: React.ReactNode;
  /** Rendered beneath the card, e.g. counters and menus during a game. */
  children?: React.ReactNode;
}) => {
  return (
    <CardDetailContainer>
      <CardDetailHeader>
        <CardDetailName>
          <Msg value={props.card.display} />
        </CardDetailName>
        {props.card.imageSourceUrl && (
          <CardDetailLink url={props.card.imageSourceUrl} />
        )}
      </CardDetailHeader>
      <CardDetailBody type={props.card.type}>
        <CardDetailBackground>
          <CardImage
            variant="fullsize"
            name={props.card.name}
            type={props.card.type}
            subtype={props.card.subtype?.key}
          />
        </CardDetailBackground>
        <CardDetailForeground>
          <div />
          <CardDetailActions>
            {props.card.triggerInstructions && (
              <CardDetailTriggerInstructions>
                <Msg value={props.card.triggerInstructions} />
              </CardDetailTriggerInstructions>
            )}
            {/* A card has at most one action of each type, so the type is a
                stable key. */}
            {props.actions ??
              props.card.actions.map((action) => (
                <CardDetailTextBox key={action.type}>
                  <Msg value={action.instructions ?? null} />
                </CardDetailTextBox>
              ))}
          </CardDetailActions>
        </CardDetailForeground>
      </CardDetailBody>
      {props.children}
    </CardDetailContainer>
  );
};
