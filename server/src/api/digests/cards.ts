/**
 * Transformation from a card's definition to its transport representation
 */
import type { cardDefDigestSchema } from "@common/api/digests";
import { actionTypes } from "@common/game/enums";
import type { CardDef } from "@server/game/types";
import type z from "zod";

export type CardDefDigest = z.infer<typeof cardDefDigestSchema>;

/******************************************************************************
 * ### cardDefDigest
 *
 * Transforms a card definition into everything the front end needs to render
 * the face of the card.
 ******************************************************************************/
export function cardDefDigest(cardDef: CardDef): CardDefDigest {
  // Actions should be displayed in order.
  const actions: CardDefDigest["actions"] = [];
  for (const type of actionTypes) {
    const matchDef = cardDef.actions[type];
    if (!matchDef) continue;
    actions.push({
      type,
      instructions: matchDef.instructions,
    });
  }

  const imageSourceLink = cardDef.links?.find((l) => l.type === "imgsrc");

  return {
    name: cardDef.name,
    display: cardDef.display ?? { key: cardDef.name },
    triggerInstructions: cardDef.trigger?.instructions ?? null,
    imageSourceUrl: imageSourceLink?.url ?? "",
    type: cardDef.type,
    subtype: cardDef.subtype ?? null,
    actions,
  };
}
