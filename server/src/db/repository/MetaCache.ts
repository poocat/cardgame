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

/** A live snapshot, or a tombstone (`meta: null`) left behind by `evict`. */
type Entry = { meta: MetaSnapshot | null; gen: number };

/******************************************************************************
 * ### MetaCache
 *
 * Caches the `meta` object, keyed by `meta.id`, deleting least-recently used
 * entries first.
 *
 * When a snapshot is evicted, an entry remains in the cache, with a bumped
 * "generation" counter. Callers can use the generation count to avoid caching
 * stale snapshots under race conditions.
 ******************************************************************************/
export class MetaCache {
  private store = new Map<string, Entry>();
  private max: number;

  constructor(max: number = 1000) {
    this.max = max;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Move entry to the most recently-used position so the LRU bound doesn't
   * evict recently-polled entries.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  private touch(id: string, entry: Entry) {
    this.store.delete(id);
    this.store.set(id, entry);
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Stores (or re-stores) entry and prunes the store to the max.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  private write(id: string, entry: Entry): void {
    this.touch(id, entry);
    if (this.store.size > this.max) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Getter for the current "set count" for the given `id`, if cached.
   *
   * Use to avoid updating the cache with a stale value. Capture before an
   * asynchronous read, then pass back along with `set` to ensure that a
   * mid-flight update (eviction) isn't undone.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  generation(id: string): number {
    return this.store.get(id)?.gen ?? 0;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Look up the cached snapshot for the given id. If found, moves the entry
   * to "most recently-used" position.
   *
   * Callers should treat the returned snapshot as immutable.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  get(id: string): MetaSnapshot | undefined {
    const entry = this.store.get(id);
    if (!entry || entry.meta === null) return undefined;
    this.touch(id, entry);
    return entry.meta;
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Creates or updates an entry in the cache for the given id.
   *
   * If an "observed generation" is given, will avoid updating the cache if
   * the observed generation doesn't match the current cache generation. This
   * can be used to avoid updating the cache with a stale value from a read
   * that started before an update operation evicted the corresponding entry.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  set(id: string, meta: MetaSnapshot, observedGen?: number): void {
    const gen = this.store.get(id)?.gen ?? 0;
    if (observedGen !== undefined && observedGen !== gen) return;
    this.write(id, { meta, gen });
  }

  /** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
   * Nulls the snapshot stored in the cache entry for the given id and bumps
   * the generation, if an entry exists.
   ** * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
  evict(id: string): void {
    const gen = (this.store.get(id)?.gen ?? 0) + 1;
    this.write(id, { meta: null, gen });
  }
}
