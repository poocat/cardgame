import { getCardDefinition } from "@server/game/cards/utils";
import { IAccessor, IMutator } from "@server/game/types";

/******************************************************************************
 * ### Trigger Effects for Cards in Play
 *
 * Any card in play may have a trigger defined for it.
 ******************************************************************************/
export function triggeredEffects(args: {
  current: IAccessor;
  next: IAccessor;
  mutator: IMutator;
}): void {
  args.current.getCards({ locationTypes: ["inPlay"] }).forEach((c) => {
    const cardDef = getCardDefinition(c.name);
    if (cardDef.trigger) {
      cardDef.trigger.affect({
        current: args.current,
        next: args.next,
        context: { cardId: c.id },
        mutator: args.mutator,
      });
    }
  });
}
