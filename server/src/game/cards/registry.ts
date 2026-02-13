/**
 * The global registry of cards that can be used in the game.
 *
 * Can be extended at runtime, for the purpose of testing.
 */

import type { ActionDef, CardDef } from "@server/game/types";
import type { ActionType } from "@server/types";
import { exampleConsumer } from "./definitions/exampleConsumer";
import { exampleProducer } from "./definitions/exampleProducer";
import { exampleProducerThatCanDie } from "./definitions/exampleProducerThatCanDie";
import { exampleProducerThatInvolvesAllPlayers } from "./definitions/exampleProducerThatInvolvesAllPlayers";

type CardMap = { [key: string]: CardDef };

/******************************************************************************
 * The master set of cards defined for the game.
 ******************************************************************************/
export const CARDS = {
  exampleConsumer,
  exampleProducer,
  exampleProducerThatCanDie,
  exampleProducerThatInvolvesAllPlayers,
} as const satisfies CardMap;

const baseCards = new Map<string, CardDef>(
  Object.values(CARDS).map((c) => [c.name, c]),
);
const extendedCards = new Map<string, CardDef>();

/******************************************************************************
 * ### getCardDefinition
 *
 * Reads from the current global card registry to get the card definition from
 * its unique name.
 ******************************************************************************/
export function getCardDefinition(name: string): CardDef {
  const match = extendedCards.get(name) ?? baseCards.get(name);
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
    extendedCards.set(c.name, c);
  });
}

/******************************************************************************
 * ### resetCardRegistry
 *
 * Use to remove any extensions made to the global card registry, presumably
 * to add dummy cards used as fixtures in unit tests.
 ******************************************************************************/
export function resetCardRegistry() {
  extendedCards.clear();
}
