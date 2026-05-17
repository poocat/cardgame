import { matchesHeader } from "@server/api/etags";
import { describe, expect, it } from "vitest";

describe("matchesHeader", () => {
  const etag = '"abc123=="';

  it("returns false when the header is absent", () => {
    expect(matchesHeader(undefined, etag)).toBe(false);
  });

  it("matches an exact strong validator", () => {
    expect(matchesHeader('"abc123=="', etag)).toBe(true);
  });

  it("matches a weak validator (proxy weakened the strong ETag)", () => {
    expect(matchesHeader('W/"abc123=="', etag)).toBe(true);
  });

  it("matches inside a comma-separated list", () => {
    expect(matchesHeader('"other", W/"abc123=="', etag)).toBe(true);
  });

  it("matches the wildcard", () => {
    expect(matchesHeader("*", etag)).toBe(true);
  });

  it("does not match a different validator", () => {
    expect(matchesHeader('"different"', etag)).toBe(false);
  });
});
