import { ActionTypeMap } from "@server/types";
import { ActionContext, IMutator } from "@server/game/types";

/******************************************************************************
 * ### Action Effects
 *
 * Default effects that occur when an action completes, based on action type.
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
