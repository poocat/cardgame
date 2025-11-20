import { CardData, CardTypeMap } from "@server/types";
import { IAccessor, IMutator } from "@server/game/types";

/******************************************************************************
 * ### Card Type Triggers
 *
 * Automatic triggers that fire based on card type after each action.
 * Co-located with activity triggers since they fire in the same phase.
 ******************************************************************************/
export const cardTypeTriggeredEffects: CardTypeMap<
  (args: { cardData: CardData; accessor: IAccessor; mutator: IMutator }) => void
> = {
  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * No type-based triggers for "producer" cards.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  producer: () => {},

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * "Consumer" cards must be "alive" at the end of the activity (that is, they
   * have at least one chip on them), else they must be discarded.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  consumer: ({ cardData, accessor, mutator }) => {
    const alive = accessor.chips.some(
      (c) => c.location.type === "onCard" && c.location.cardId === cardData.id,
    );
    if (!alive) {
      mutator.moveCard({ id: cardData.id, location: { type: "inDiscard" } });
    }
  },
};
