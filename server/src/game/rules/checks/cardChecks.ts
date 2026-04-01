import { CONSTANTS } from "@common/game/constants";
import type { CheckResult, IAccessor } from "@server/game/types";
import { msg } from "@server/text/messages";
import type { CardData, CardTypeMap } from "@server/types";

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
    const inPlay = accessor.getCards({
      playerIds: [cardData.ownerId],
      types: ["producer"],
      locationTypes: ["inPlay"],
    });
    if (
      cardData.location.type !== "inPlay" &&
      inPlay.length >= CONSTANTS.maxNumProducersInPlay
    ) {
      return {
        ok: false,
        reasons: [
          msg("reason.maxProducersInPlay", {
            n: CONSTANTS.maxNumProducersInPlay,
          }),
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
  consumer: ({ cardData, accessor }) => {
    const inPlay = accessor.getCards({
      playerIds: [cardData.ownerId],
      types: ["consumer"],
      locationTypes: ["inPlay"],
    });
    if (
      cardData.location.type !== "inPlay" &&
      inPlay.length >= CONSTANTS.maxNumConsumersInPlay
    ) {
      return {
        ok: false,
        reasons: [
          msg("reason.maxConsumersInPlay", {
            n: CONSTANTS.maxNumConsumersInPlay,
          }),
        ],
      };
    } else {
      return { ok: true };
    }
  },
};
