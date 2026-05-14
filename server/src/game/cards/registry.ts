/**
 * The global registry of cards that can be used in the game.
 *
 * Can be extended at runtime, using a test set of cards, an example set, or
 * a custom set.
 *
 * This repository is configured to use a submodule at
 * `private/` as the source of all "official" card definitions and images.
 */
import type { ActionDef, CardDef } from "@server/game/types";
import { logger } from "@server/logger";
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
 * Use to extend the global card registry.
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
 * Resets the card registry and fills it with with cards that are included with
 * the base repository.
 ******************************************************************************/
export function useExampleCards() {
  resetCardRegistry();
  extendCardRegistry({ cards: Object.values(exampleCardMap) });
  logger.info({ count: cardMap.size }, "loaded example cards");
}

/******************************************************************************
 * ### usePrivateCards
 *
 * Resets the card registry and fills it with with cards from the private
 * submodule located at `private/cards`.
 *
 * The `cards` directory must have an `index.ts` file, which exports
 * an `Object` named `cards`, the values of which have the `CardDef` type
 * exported from `@server/game/types`.
 ******************************************************************************/
export function usePrivateCards(cardsPath: string | null) {
  if (!cardsPath) {
    throw new Error("No private path configured.");
  }
  // The require uses a static path so the cards compile with the server.
  // `cardsPath` is a presence check, not a load target.
  const { cards } = require("@private/cards");
  resetCardRegistry();
  extendCardRegistry({ cards: Object.values(cards) });
  logger.info({ count: cardMap.size }, "loaded private cards");
}

/******************************************************************************
 * ### allRegisteredCards
 *
 * Get the complete list of cards currently in the registry.
 ******************************************************************************/
export function allRegisteredCards() {
  return [...cardMap.values()];
}
