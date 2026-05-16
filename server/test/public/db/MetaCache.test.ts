import { MetaCache, type MetaSnapshot } from "@server/db/repository/MetaCache";
import { describe, expect, it } from "vitest";

function snapshot(id: string): MetaSnapshot {
  const now = new Date().toISOString();
  return { id, version: 0, createdAt: now, updatedAt: now, salt: `salt-${id}` };
}

describe("MetaCache", () => {
  it("returns undefined for an unknown id", () => {
    expect(new MetaCache().get("nope")).toBeUndefined();
  });

  it("round-trips a snapshot through set/get", () => {
    const cache = new MetaCache();
    const snap = snapshot("a");
    cache.set("a", snap);
    expect(cache.get("a")).toBe(snap);
  });

  it("evict removes a single entry", () => {
    const cache = new MetaCache();
    cache.set("a", snapshot("a"));
    cache.evict("a");
    expect(cache.get("a")).toBeUndefined();
  });

  it("evictAll clears every entry", () => {
    const cache = new MetaCache();
    cache.set("a", snapshot("a"));
    cache.set("b", snapshot("b"));
    cache.evictAll();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });

  it("drops the least-recently used entry past the bound", () => {
    const cache = new MetaCache(2);
    cache.set("a", snapshot("a"));
    cache.set("b", snapshot("b"));
    // Touch "a" so "b" becomes least-recently used.
    cache.get("a");
    cache.set("c", snapshot("c"));

    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBeDefined();
    expect(cache.get("c")).toBeDefined();
  });

  it("re-setting an existing id refreshes its recency", () => {
    const cache = new MetaCache(2);
    cache.set("a", snapshot("a"));
    cache.set("b", snapshot("b"));
    cache.set("a", snapshot("a")); // "b" is now least-recently used
    cache.set("c", snapshot("c")); // cache is now full

    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBeDefined();
  });
});
