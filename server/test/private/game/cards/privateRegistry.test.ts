import { cardDefDigestSchema } from "@common/api/digests";
import { cards } from "@private/cards";
import { cardDefDigest } from "@server/api/digests/cards";
import {
  allRegisteredCards,
  extendCardRegistry,
  resetCardRegistry,
} from "@server/game/cards/registry";
import { beforeAll, expect, test } from "vitest";

beforeAll(() => {
  resetCardRegistry();
  extendCardRegistry({ cards: Object.values(cards) });
});

test("private card registry loads and is not empty", () => {
  expect(allRegisteredCards().length).toBeGreaterThan(0);
});

test("every private card definition digests to a valid definition", () => {
  for (const cardDef of allRegisteredCards()) {
    const result = cardDefDigestSchema.safeParse(cardDefDigest(cardDef));
    // Report the offending card by name rather than a bare `false`.
    expect(
      result.error?.issues.map((i) => `${cardDef.name}: ${i.message}`) ?? [],
    ).toEqual([]);
  }
});
