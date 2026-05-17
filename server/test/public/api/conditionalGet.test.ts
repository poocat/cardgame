import { ifNoneMatchSatisfied } from "@server/api/conditionalGet";
import { describe, expect, it } from "vitest";

describe("ifNoneMatchSatisfied", () => {
  const etag = '"abc123=="';

  it("returns false when the header is absent", () => {
    expect(ifNoneMatchSatisfied(undefined, etag)).toBe(false);
  });

  it("matches an exact strong validator", () => {
    expect(ifNoneMatchSatisfied('"abc123=="', etag)).toBe(true);
  });

  it("matches a weak validator (proxy weakened the strong ETag)", () => {
    expect(ifNoneMatchSatisfied('W/"abc123=="', etag)).toBe(true);
  });

  it("matches inside a comma-separated list", () => {
    expect(ifNoneMatchSatisfied('"other", W/"abc123=="', etag)).toBe(true);
  });

  it("matches the wildcard", () => {
    expect(ifNoneMatchSatisfied("*", etag)).toBe(true);
  });

  it("does not match a different validator", () => {
    expect(ifNoneMatchSatisfied('"different"', etag)).toBe(false);
  });
});
