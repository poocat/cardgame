import { messageKeys } from "@server/text/keys";
import defaultEn from "@server/text/locales/en.json";
import { missingBundleKeys } from "@server/text/registry";
import { describe, expect, it } from "vitest";

describe("default en.json", () => {
  it("contains all public message keys", () => {
    const missing = missingBundleKeys(defaultEn, messageKeys);
    expect(missing).toEqual([]);
  });
});
