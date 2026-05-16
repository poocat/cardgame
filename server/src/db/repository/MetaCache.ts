/**
 * Implementation of a simple cache tailored to MongoDB documents that use a
 * common "metadata schema".
 *
 * Warning: the cache is per-process and has no TTL, and therefore is unsafe
 * if the application is scaled to multiple instances!
 *
 * To illustrate:
 * Say there are two instances running, A and B, and by some luck, they both
 * have the same document metadata cached for a given game. If the load balancer
 * chooses A for the next update (evicting the cache entry on A), then B for the
 * next read, the request processed by B will continue serving the stale meta
 * from before the update.
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
}
