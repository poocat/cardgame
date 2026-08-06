import { apiUrl } from "@client/utils/api";
import { useMessages } from "@client/utils/messages";
import { ROUTES } from "@common/api/routes";
import { useState } from "react";
import type { CardFormFactor, CardType } from "./types";
import "./styles.css";

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Indicates where the icon will be drawn in the card "frame".
 * - `thumbnail` / `fullsize`: behind the card art, positioned to the
 *   transparent circle in that variant's border.
 * - `fallback`: no art available, so the icon is larger and centered.
 */
export type CardTypeIconPlacement = CardFormFactor | "fallback";

/******************************************************************************
 * ### CardTypeIcon
 *
 * The themed icon indicating whether a card is a producer or a consumer.
 *
 * The position of the icon in the frame is dialed-in to fit in a specific
 * part of the card image.
 ******************************************************************************/
const CardTypeIcon = (props: {
  type: CardType;
  placement: CardTypeIconPlacement;
}) => {
  const { lookup } = useMessages();
  const match = lookup(`term.${props.type}`);
  if (match.type !== "icon") return null;

  return (
    <span
      className={`card-type-icon card-type-icon--${props.placement}`}
      role="img"
      aria-label={props.type}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: content is server-sanitized at bundle load via DOMPurify (svg profile).
      dangerouslySetInnerHTML={{ __html: match.value }}
    />
  );
};

/******************************************************************************
 * ### CardSubtypeIcon
 *
 * The themed icon indicating the card's subtype.
 *
 * The position of the icon in the frame is dialed-in to fit in a specific
 * part of the card image. (The upper right hand corner.)
 ******************************************************************************/
const CardSubtypeIcon = (props: {
  subtype: string;
  placement: CardTypeIconPlacement;
}) => {
  const { lookup } = useMessages();
  const match = lookup(props.subtype);
  if (match.type !== "icon") return null;

  return (
    <span
      className={`card-subtype-icon card-subtype-icon--${props.placement}`}
      role="img"
      aria-label={props.subtype}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: content is server-sanitized at bundle load via DOMPurify (svg profile).
      dangerouslySetInnerHTML={{ __html: match.value }}
    />
  );
};

/******************************************************************************
 * ### CardImage
 *
 * The card's art with its producer/consumer type icon showing through the
 * transparent circle in the border template. The icon is rendered behind the
 * art so the opaque part of the art occludes it and only the circle reveals
 * it.
 *
 * When the art is unavailable (not yet delivered, rate limited, 404), the
 * type icon is shown on its own, centered, so the card still communicates its
 * type instead of rendering nothing.
 ******************************************************************************/
export const CardImage = (props: {
  name: string;
  type: CardType;
  subtype: string | null | undefined;
  formFactor: CardFormFactor;
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) return <CardTypeIcon type={props.type} placement="fallback" />;

  return (
    <div className="card-image-container">
      <CardTypeIcon type={props.type} placement={props.formFactor} />
      {props.subtype && (
        <CardSubtypeIcon subtype={props.subtype} placement={props.formFactor} />
      )}
      <img
        className="card-image"
        src={apiUrl(
          `${ROUTES.cards.path}${ROUTES.cards.methods.images.path}/${slugify(props.name)}.${props.formFactor}.png`,
        )}
        onError={() => setFailed(true)}
        alt={props.name}
      />
    </div>
  );
};
