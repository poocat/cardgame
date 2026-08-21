import { msg } from "@common/text/messages";
import type { CheckResult, IAccessor } from "@server/game/types";
import type { ActionData, ActionTypeMap, Message } from "@server/types";
import { cardPlayChecks } from "./cardChecks";

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
    const reasons: Message[] = [];
    const result = cardPlayChecks[matchingCard.type]({
      accessor,
      cardData: matchingCard,
    });
    if (!result.ok) {
      reasons.push(...result.reasons);
    }
    if (matchingCard.location.type !== "inHand") {
      reasons.push(msg("reason.cardAlreadyInPlay"));
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
    const reasons: Message[] = [];
    if (!matchingCard) {
      reasons.push(msg("reason.cardNotInGame"));
    } else if (matchingCard.location.type !== "inPlay") {
      reasons.push(msg("reason.cardNotInPlay"));
    } else if (matchingCard?.location.exhausted) {
      reasons.push(msg("reason.cardExhausted"));
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
    const reasons: Message[] = [];
    if (!matchingCard) {
      reasons.push(msg("reason.cardNotInGame"));
    } else if (matchingCard.location.type !== "inPlay") {
      reasons.push(msg("reason.cardNotInPlay"));
    } else if (matchingCard?.location.exhausted) {
      reasons.push(msg("reason.cardExhausted"));
    }
    if (reasons.length > 0) {
      return { ok: false, reasons };
    } else {
      return { ok: true };
    }
  },
};
