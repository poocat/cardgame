/**
 * Transformation from a card's definition to its transport representation
 */
import type { cardDefDigestSchema } from "@common/api/digests";
import { actionTypes } from "@common/game/enums";
import type { CardDef } from "@server/game/types";
import { msg } from "@server/text/messages";
import type { ActionType, Message } from "@server/types";
import type z from "zod";

export type CardDefDigest = z.infer<typeof cardDefDigestSchema>;

/**
 * Simple switch to get the message corresponding to the given action type.
 */
export function actionTypeMessage(actionType?: ActionType): Message {
  switch (actionType) {
    case "play":
      return msg("action.type.play");
    case "ability":
      return msg("action.type.ability");
    case "discard":
      return msg("action.type.discard");
    default:
      throw new Error(`Unexpected action type: ${actionType}`);
  }
}

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
    const actionMessage = actionTypeMessage(type);
    actions.push({
      type,
      // If no instructions, just serve the action type.
      instructions: matchDef.instructions
        ? msg("label.action.instructions", {
            actionType: actionMessage,
            instructions: matchDef.instructions,
          })
        : actionMessage,
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
