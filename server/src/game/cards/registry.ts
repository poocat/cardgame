/**
 * The global registry of cards that can be used in the game.
 *
 * Can be extended at runtime, using a test set of cards, an example set, or
 * a custom set.
 */

import type { ActionDef, CardDef } from "@server/game/types";
import type { ActionType } from "@server/types";
import { cards as exampleCardMap } from "./examples";

const cardMap = new Map<string, CardDef>();

/******************************************************************************
 * ### getCardDefinition
 *
 * Reads from the current global card registry to get the card definition from
 * its unique name.
 ******************************************************************************/
export function getCardDefinition(name: string): CardDef {
  const match = cardMap.get(name);
  if (!match) {
    throw new Error(`No card found with name ${name}`);
  }
  return match;
}

/******************************************************************************
 * ### getActionDefinition
 *
 * Reads from the current global card registry to get the definition of the
 * action of the given type on the card with the given name.
 ******************************************************************************/
export function getActionDefinition(args: {
  cardName: string;
  actionType: ActionType;
}): ActionDef {
  const match = getCardDefinition(args.cardName).actions[args.actionType];
  if (!match) {
    throw new Error(`No ${args.actionType} action on card ${args.cardName}`);
  }
  return match;
}

/******************************************************************************
 * ### extendCardRegistry
 *
 * Use to extend the global card registry, presumably with dummy cards used as
 * fixtures in unit tests.
 ******************************************************************************/
export function extendCardRegistry(args: { cards: CardDef[] }) {
  args.cards.forEach((c) => {
    cardMap.set(c.name, c);
  });
}

/******************************************************************************
 * ### resetCardRegistry
 *
 * Use to remove any extensions made to the global card registry, presumably
 * to add dummy cards used as fixtures in unit tests.
 ******************************************************************************/
export function resetCardRegistry() {
  cardMap.clear();
}

/******************************************************************************
 * ### useExampleCards
 *
 * Extends the card registry with example cards that are included with the base
 * repository.
 ******************************************************************************/
export function useExampleCards() {
  extendCardRegistry({ cards: Object.values(exampleCardMap) });
}

/******************************************************************************
 * ### usePrivateCards
 *
 * Extends the card registry with cards in the private card repository.
 ******************************************************************************/
export function usePrivateCards() {
  const { cards } = require("./private/index");
  extendCardRegistry({ cards: Object.values(cards) });
}

/******************************************************************************
 * ### allRegisteredCards
 *
 * Get the complete list of cards currently in the registry.
 ******************************************************************************/
export function allRegisteredCards() {
  return [...cardMap.values()];
}
