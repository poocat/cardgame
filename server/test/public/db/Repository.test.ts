import type { GameData } from "@server/types";
import type { Collection } from "mongodb";
import { afterAll, describe, expect, it, vi } from "vitest";
import { testDb } from "../../helpers/testDb";

// The cache mechanics are payload-agnostic; a stub stands in for GameData.
const data = { stub: true } as unknown as GameData;

async function setup() {
  const db = await testDb();
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
});
