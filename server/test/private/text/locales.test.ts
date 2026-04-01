import { messageKeys as privateKeys } from "@private/text/keys";
import { messageKeys as publicKeys } from "@server/text/keys";
import {
  getLocaleBundle,
  missingBundleKeys,
  useDefaultLocales,
  usePrivateLocales,
} from "@server/text/registry";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const allKeys = [...publicKeys, ...privateKeys];

beforeAll(() => {
  usePrivateLocales();
});

afterAll(() => {
  useDefaultLocales();
});

describe("private locale bundles", () => {
  it("en contains all public and private message keys", () => {
    const bundle = getLocaleBundle("en");
    const missing = missingBundleKeys(bundle, allKeys);
    expect(missing).toEqual([]);
  });
});
