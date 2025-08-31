import { CardData, CardTypeMap } from "@common/types";
import { CONFIG } from "@server/game/rules/config";
import { GameState } from "@server/game/utils/GameState";
import { CheckResult, IMutator } from "@server/types";

/******************************************************************************
 * ## "Play Card" Action Checks by Card Type
 *
 * Game state checks to determine whether or not a card can be brought into
 * play.
 ******************************************************************************/
export const cardTypePlayChecks: CardTypeMap<
  (args: { cardData: CardData; gameState: GameState }) => CheckResult
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A player can only have a certain number of "producer" cards in play at a
   * time.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  producer: ({ cardData, gameState }) => {
    const producersInPlay = gameState.cards.filter(
      (c) =>
        c.location.type === "inPlay" &&
        c.type === "producer" &&
        c.ownerPlayerId == cardData.ownerPlayerId,
    );
    if (producersInPlay.length >= CONFIG.MAX_NUM_PRODUCERS_IN_PLAY) {
      return {
        ok: false,
        reasons: [
          `Already ${CONFIG.MAX_NUM_PRODUCERS_IN_PLAY} producers in play.`,
        ],
      };
    } else {
      return { ok: true };
    }
  },

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * There are no limits on the number of "consumer" cards that can be brought
   * into play.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  consumer: () => {
    return { ok: true };
  },
};

/******************************************************************************
 * ### Automatic Triggers by Card Type
 *
 * Effects that should trigger, per card type, for each card in play, at the end
 * of each "take action" activity.
 ******************************************************************************/
export const cardTypeTriggeredEffects: CardTypeMap<
  (args: {
    cardData: CardData;
    gameState: GameState;
    mutator: IMutator;
  }) => void
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * No type-based triggers for "producer" cards.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  producer: () => { },

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * "Consumer" cards must be "alive" at the end of the activity (that is, they
   * have at least one chip on them), else they must be discarded.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  consumer: ({ cardData, gameState, mutator }) => {
    const alive = gameState.chips.some(
      (c) => c.location.type === "onCard" && c.location.cardId === cardData.id,
    );
    if (!alive) {
      mutator.moveCard({ id: cardData.id, location: { type: "inDiscard" } });
    }
  },
};
