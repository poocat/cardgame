import { ActionData, ActionTypeMap } from "@common/types";
import { cardTypePlayChecks } from "@server/game/rules/cards";
import { GameState } from "@server/game/utils/GameState";
import { ActionContext, CheckResult, IMutator } from "@server/types";

/******************************************************************************
 * ### Action Checks by Type
 *
 * Game state checks to determine whether or not an action can be taken based
 * on its type.
 ******************************************************************************/
export const actionTypeChecks: ActionTypeMap<
  (args: { actionData: ActionData; gameState: GameState }) => CheckResult
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * "Play" actions can only be taken on cards that are in the player's hand.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  play: ({ actionData, gameState }) => {
    const matchingCard = gameState.getCardById({ cardId: actionData.card.id });
    const reasons: string[] = [];
    const result = cardTypePlayChecks[matchingCard.type]({
      gameState,
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
  ability: ({ actionData, gameState }) => {
    const matchingCard = gameState.getCardById({ cardId: actionData.card.id });
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
  discard: ({ actionData, gameState }) => {
    const matchingCard = gameState.getCardById({ cardId: actionData.card.id });
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

/******************************************************************************
 * ### Automatic Effects by Action Type
 *
 * Effects that should take place per action type, regardless of the
 * implementation of the action on the card, once the action is completed.
 ******************************************************************************/
export const actionTypeDefaultEffects: ActionTypeMap<
  (args: { context: ActionContext; mutator: IMutator }) => void
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * "Play" actions should result in moving the card into play.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  play: (args) => {
    args.mutator.moveCard({
      id: args.context.cardId,
      location: { type: "inPlay", exhausted: false },
    });
  },

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * "Ability" actions should exhaust the card.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  ability: (args) => {
    args.mutator.exhaustCard({ id: args.context.cardId, value: true });
  },

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * "Discard" actions should move the card out of play.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  discard: (args) => {
    args.mutator.moveCard({
      id: args.context.cardId,
      location: { type: "inDiscard" },
    });
  },
};
