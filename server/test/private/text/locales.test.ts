import { messageKeys as publicKeys } from "@common/text/keys";
import { messageKeys as privateKeys } from "@private/text/keys";
import { CONFIG } from "@server/config";
import { createPrivatePaths } from "@server/paths";
import {
  getLocaleBundle,
  missingBundleKeys,
  useDefaultLocales,
  usePrivateLocales,
} from "@server/text/registry";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const allKeys = [...publicKeys, ...privateKeys];
const { locales: localesPath } = createPrivatePaths(CONFIG.privatePath);

beforeAll(() => {
  if (!localesPath) throw new Error("test requires private submodule");
  usePrivateLocales(localesPath);
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
