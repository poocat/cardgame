import { CardData, CardTypeMap } from "@server/types";
import { GameState } from "@server/game/utils/GameState";
import { IMutator } from "@server/game/types";

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
  producer: () => {},

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
