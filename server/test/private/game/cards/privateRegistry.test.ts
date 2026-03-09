import { cards } from "@private/cards";
import {
  allRegisteredCards,
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { expect, test } from "vitest";

test("private card registry loads and is not empty", () => {
  resetCardRegistry();
  extendCardRegistry({ cards: Object.values(cards) });
  expect(allRegisteredCards().length).toBeGreaterThan(0);
});
