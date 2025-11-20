import { CONSTANTS } from "@common/game/constants";
import { CardData, CardTypeMap } from "@server/types";
import { CheckResult, IAccessor } from "@server/game/types";

/******************************************************************************
 * ### Card Play Checks
 *
 * Checks whether a card can be brought into play based on card type.
 * Co-located with action validation for cohesion.
 ******************************************************************************/
export const cardPlayChecks: CardTypeMap<
  (args: { cardData: CardData; accessor: IAccessor }) => CheckResult
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A player can only have a certain number of "producer" cards in play at a
   * time.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  producer: ({ cardData, accessor }) => {
    const producersInPlay = accessor.cards.filter(
      (c) =>
        c.location.type === "inPlay" &&
        c.type === "producer" &&
        c.ownerId == cardData.ownerId,
    );
    if (producersInPlay.length >= CONSTANTS.maxNumProducersInPlay) {
      return {
        ok: false,
        reasons: [
          `Already ${CONSTANTS.maxNumProducersInPlay} producers in play.`,
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
