import type { IAccessor, IMutator } from "@server/game/types";
import type { ActivityTypeMap } from "@server/types";
import { cardTypeTriggeredEffects } from "./cardTriggers";

/******************************************************************************
 * ## Activity Type Triggers
 *
 * Effects that are triggered by changes in game data that came about as a
 * result of concluding the given activity type.
 * Co-located with card triggers since they fire in the same phase.
 *
 * Note: these are not applied in a loop! Be careful that triggers do not rely
 * on other triggers!
 ******************************************************************************/
export const activityTypeTriggeredEffects: ActivityTypeMap<
  (args: {
    /** The game data before any effects were applied to the game data. */
    current: IAccessor;
    /** The game data after any effects were applied at the conclusion of the current activity. */
    next: IAccessor;
    mutator: IMutator;
  }) => void
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * The "draw cards" activity is always the first part of the turn.
   *
   * All a player's cards in play should be unexhausted at the conclusion of
   * this activity, in preparation for the "choosing action" activity.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  drawingCards: ({ next, mutator }) => {
    const playerTakingTurn = next.getPlayerTakingTurn();
    next
      .getCards({
        playerIds: [playerTakingTurn.id],
        locationTypes: ["inPlay"],
        exhausted: true,
      })
      .forEach((c) => {
        mutator.exhaustCard({ id: c.id, value: false });
      });
  },

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   *
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  choosingAction: () => {},

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * A number of default triggers are checked at the conclusion of a "taking
   * action" activity.
   *
   * E.g.:
   * - "dead" "consumer" cards are discarded
   * - chips that were located on cards that left play need to return to the
   * "reserve"
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  takingAction: ({ current, next, mutator }) => {
    const cardsInPlay = current.getCards({ locationTypes: ["inPlay"] });
    // Trigger effects based on card type.
    cardsInPlay.forEach((cardData) => {
      cardTypeTriggeredEffects[cardData.type]({
        cardData,
        accessor: next,
        mutator,
      });
    });
    // Clean up any chips that are located on cards that are no longer in play.
    const cardsInPlayIds = cardsInPlay.map((c) => c.id);
    const strayChipIds = current.chips
      .filter(
        (c) =>
          c.location.type === "onCard" &&
          !cardsInPlayIds.includes(c.location.cardId),
      )
      .map((c) => c.id);
    if (strayChipIds.length > 0) {
      mutator.moveChips({ ids: strayChipIds, location: { type: "inReserve" } });
    }
  },
};
