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

  describe("generation guard", () => {
    it("starts at generation 0 and bumps on each evict", () => {
      const cache = new MetaCache();
      expect(cache.generation("a")).toBe(0);
      cache.set("a", snapshot("a"));
      expect(cache.generation("a")).toBe(0);
      cache.evict("a");
      expect(cache.generation("a")).toBe(1);
      cache.evict("a");
      expect(cache.generation("a")).toBe(2);
    });

    it("drops a set whose observed generation predates an evict", () => {
      const cache = new MetaCache();
      cache.set("a", snapshot("a"));

      // A read begins here, observing the current generation.
      const observed = cache.generation("a");
      // A concurrent update evicts before the read resolves.
      cache.evict("a");
      // The read resolves and tries to warm the cache with its now-stale snap.
      cache.set("a", snapshot("a"), observed);

      expect(cache.get("a")).toBeUndefined();
    });

    it("accepts a set whose observed generation still matches", () => {
      const cache = new MetaCache();
      const observed = cache.generation("a"); // 0, no entry yet
      const snap = snapshot("a");
      cache.set("a", snap, observed);
      expect(cache.get("a")).toBe(snap);
    });

    it("re-warms cleanly after an evict with a fresh generation", () => {
      const cache = new MetaCache();
      cache.set("a", snapshot("a"));
      cache.evict("a");

      const observed = cache.generation("a"); // post-evict generation
      const fresh = snapshot("a");
      cache.set("a", fresh, observed);

      expect(cache.get("a")).toBe(fresh);
    });
  });
});
