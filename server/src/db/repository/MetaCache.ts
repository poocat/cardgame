/**
 * Implementation of a simple cache tailored to MongoDB documents that use a
 * common "metadata schema".
 *
 * Bounded LRU of document metadata, keyed by document id. Lets Repository
 * answer `findOne({ metaOnly: true })` (the ETag fast path for conditional
 * GETs) without a Mongo round trip.
 *
 * Invariant: only ever holds values that were observed through its owning
 * Repository instance. Writes through that Repository invalidate the entry;
 * anything that bypasses the Repository (migrations, manual `mongosh`) must
 * call `evictAll()` or accept a stale window.
 */
import type { RepositoryDoc } from "@server/db/types";

export type MetaSnapshot = RepositoryDoc<unknown>["meta"];

/******************************************************************************
 * ### MetaCache
 *
 * Caches `meta` object, keyed by `meta.id`, deleting least-recently used
 * entries first.
 ******************************************************************************/
export class MetaCache {
  private store = new Map<string, MetaSnapshot>();
  private max: number;

  constructor(max: number = 1000) {
    this.max = max;
  }

  private touch(id: string, value: MetaSnapshot) {
    this.store.delete(id);
    this.store.set(id, value);
  }

  get(id: string): MetaSnapshot | undefined {
    const value = this.store.get(id);
    if (value === undefined) return undefined;
    // Touch: move to the most-recently-used position so the LRU bound evicts
    // genuinely cold entries rather than recently-polled ones.
    this.touch(id, value);
    return value;
  }

  set(id: string, meta: MetaSnapshot): void {
    this.touch(id, meta);
    if (this.store.size > this.max) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
  }

  evict(id: string): void {
    this.store.delete(id);
  }

  /** For out-of-band write paths (migrations, manual `mongosh`). */
  evictAll(): void {
    this.store.clear();
  }
}
