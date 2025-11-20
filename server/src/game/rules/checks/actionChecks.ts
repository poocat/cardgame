import { ActionData, ActionTypeMap } from "@server/types";
import { cardPlayChecks } from "./cardChecks";
import { CheckResult, IAccessor } from "@server/game/types";

/******************************************************************************
 * ### Action Validation
 *
 * Checks whether an action can be taken based on action type.
 * Co-located with card validation since they work together.
 ******************************************************************************/
export const actionTypeChecks: ActionTypeMap<
  (args: { actionData: ActionData; accessor: IAccessor }) => CheckResult
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * "Play" actions can only be taken on cards that are in the player's hand.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  play: ({ actionData, accessor }) => {
    const matchingCard = accessor.getCardById({ cardId: actionData.card.id });
    const reasons: string[] = [];
    const result = cardPlayChecks[matchingCard.type]({
      accessor,
      cardData: matchingCard,
    });
    if (!result.ok) {
      reasons.push(...result.reasons);
    }
    if (matchingCard.location.type !== "inHand") {
      reasons.push("Card belonging to action is not in hand.");
    }
    if (reasons.length > 0) {
      return { ok: false, reasons };
    } else {
      return { ok: true };
    }
  },

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * "Ability" actions can only be taken when the card is in play, and the card
   * is not exhausted.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  ability: ({ actionData, accessor }) => {
    const matchingCard = accessor.getCardById({ cardId: actionData.card.id });
    const reasons: string[] = [];
    if (!matchingCard) {
      reasons.push("Card belonging to action not in game.");
    } else if (matchingCard.location.type !== "inPlay") {
      reasons.push("Card is not in play.");
    } else if (matchingCard?.location.exhausted) {
      reasons.push("Card is exhausted.");
    }
    if (reasons.length > 0) {
      return { ok: false, reasons };
    } else {
      return { ok: true };
    }
  },

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * "Discard" actions can only be taken when the card is in play, and the card
   * is not exhausted.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  discard: ({ actionData, accessor }) => {
    const matchingCard = accessor.getCardById({ cardId: actionData.card.id });
    const reasons: string[] = [];
    if (!matchingCard) {
      reasons.push("Card belonging to action not in game.");
    } else if (matchingCard.location.type !== "inPlay") {
      reasons.push("Card is not in play.");
    } else if (matchingCard?.location.exhausted) {
      reasons.push("Card is exhausted.");
    }
    if (reasons.length > 0) {
      return { ok: false, reasons };
    } else {
      return { ok: true };
    }
  },
};
