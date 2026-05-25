import type { GameData } from "@server/types";
import type { Collection } from "mongodb";
import { afterAll, describe, expect, it, vi } from "vitest";
import { testDb } from "../../helpers/testDb";

// The cache mechanics are payload-agnostic; a stub stands in for GameData.
const data = { stub: true } as unknown as GameData;

async function setup() {
  const db = await testDb({ enableMetaCache: true });
  const repo = db.repositories.games;
  // TypeScript magic to spy on a `protected` attribute.
  const collection = (repo as unknown as { collection: Collection }).collection;
  const findSpy = vi.spyOn(collection, "findOne");
  return { db, repo, findSpy };
}

describe("Repository meta cache", () => {
  const dbs: Array<{ close: () => Promise<void> }> = [];
  afterAll(async () => {
    await Promise.all(dbs.map((d) => d.close()));
  });

  it("serves metaOnly from cache after insert (no Mongo read)", async () => {
    const { db, repo, findSpy } = await setup();
    dbs.push(db);

    const inserted = await repo.insertOne({ data });
    const id = inserted?.meta.id ?? "";

    const projected = await repo.findOne({ id, metaOnly: true });

    expect(projected?.meta.id).toBe(id);
    expect(findSpy).not.toHaveBeenCalled();
  });

  it("warms the cache from a full read", async () => {
    const { db, repo, findSpy } = await setup();
    dbs.push(db);

    const inserted = await repo.insertOne({ data });
    const id = inserted?.meta.id ?? "";

    await repo.findOne({ id }); // full read, one Mongo hit, warms cache
    expect(findSpy).toHaveBeenCalledTimes(1);

    await repo.findOne({ id, metaOnly: true });
    expect(findSpy).toHaveBeenCalledTimes(1); // still 1: served from cache
  });

  it("invalidates on update so the next meta read hits Mongo and re-warms", async () => {
    const { db, repo, findSpy } = await setup();
    dbs.push(db);

    const inserted = await repo.insertOne({ data });
    const id = inserted?.meta.id ?? "";

    await repo.updateOne({ id, data });

    await repo.findOne({ id, metaOnly: true }); // evicted, Mongo read
    expect(findSpy).toHaveBeenCalledTimes(1);

    await repo.findOne({ id, metaOnly: true }); // re-warmed, no read
    expect(findSpy).toHaveBeenCalledTimes(1);
  });

  it("invalidates on delete", async () => {
    const { db, repo, findSpy } = await setup();
    dbs.push(db);

    const inserted = await repo.insertOne({ data });
    const id = inserted?.meta.id ?? "";

    await repo.deleteOne({ id });

    const projected = await repo.findOne({ id, metaOnly: true });
    expect(projected).toBeNull();
    expect(findSpy).toHaveBeenCalledTimes(1); // went to Mongo, found nothing
  });

  it("does not cache a meta from a read that raced an update", async () => {
    const { db, repo, findSpy } = await setup();
    dbs.push(db);

    const inserted = await repo.insertOne({ data });
    const id = inserted?.meta.id ?? "";

    // A pre-update snapshot, as an in-flight read would have observed it.
    const stale = await repo.findOne({ id });
    expect(stale?.meta.version).toBe(0);

    await repo.updateOne({ id, data }); // version -> 1, evicts (tombstone)

    // The next metaOnly read misses (tombstone) and hangs mid-flight while a
    // concurrent update lands, exactly the race the generation guard targets.
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    findSpy.mockImplementationOnce(async () => {
      await gate;
      return stale; // resolves with the pre-update document
    });

    const racing = repo.findOne({ id, metaOnly: true });
    await repo.updateOne({ id, data }); // version -> 2, evicts again
    release();
    const raced = await racing;

    // The in-flight request itself still sees its own stale result...
    expect(raced?.meta.version).toBe(0);

    // ...but the cache must not be poisoned: a subsequent read goes to Mongo
    // (call-through, mockImplementationOnce is spent) and sees version 2.
    const after = await repo.findOne({ id, metaOnly: true });
    expect(after?.meta.version).toBe(2);
  });
});
