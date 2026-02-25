import { getCardDefinition } from "@server/game/cards/registry";
import type { IAccessor, IMutator } from "@server/game/types";

/******************************************************************************
 * ### Custom Trigger Effects for Cards in Play
 *
 * Any card in play may have a custom trigger defined for it.
 * These are card-specific effects that fire after type-based triggers.
 *
 * Note, a trigger only becomes active in the activity following the card
 * coming into play.
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
