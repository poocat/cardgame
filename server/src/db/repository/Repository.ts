/**
 * Implementation of a "repository" pattern for MongoDB collections that use a
 * particular "metadata schema":
 *
 * ```
 * {
 *   metadata {
 *     id // the unique id for the document
 *     version // a number that is incremented each time the document is updated
 *     updatedAt // the time at which the document was last updated
 *     createdAt // the time at which the document was first created
 *     salt // a value used to anonymize/deanonymize values in the document
 *   }
 *   data {
 *     ... // collection specific payload
 *   }
 * }
 * ```
 *
 * Provides type-safe CRUD operations (e.g. findOne, findMany, insertOne,
 * updateOne, deleteOne)
 *
 * Manages document metadata like unique IDs, version numbers, and timestamps
 *
 * Supports optimistic concurrency via version checking on updates, and offers
 * "meta only" projections for lightweight queries that omit the data payload
 */
import { makeDocumentMeta } from "@server/db/meta";
import { MetaCache } from "@server/db/repository/MetaCache";
import { Queries } from "@server/db/repository/Queries";
import type {
  IRepository,
  OrderByMeta,
  ProjectedRepositoryDoc,
  RepositoryDoc,
} from "@server/db/types";
import { makeChildLogger } from "@server/logger";
import type { Collection, DeleteResult, UpdateResult } from "mongodb";

/******************************************************************************
 * ### Repository
 *
 * Provides CRUD operations on a MongoDB collection based on a common "metadata
 * schema."
 *
 * Optionally caches the document meta so that "meta only" reads can avoid a
 * query. The result is faster polling with conditional GET for recently-active
 * games.
 *
 * Caching is opt-in, and off by default, as it does not scale horizontally.
 * If multiple instances are run behind a load balancer, omit the
 * `enableMetaCache` option, or set it to `false`.
 ******************************************************************************/
export class Repository<TData> implements IRepository<TData> {
  queries: Queries<TData>;
  private logger;
  private metaCache: MetaCache | null;
  protected readonly collection: Collection<RepositoryDoc<TData>>;

  constructor(
    collection: Collection<RepositoryDoc<TData>>,
    opts?: { enableMetaCache?: boolean },
  ) {
    this.collection = collection;
    this.queries = new Queries();
    this.logger = makeChildLogger({ collection: collection.collectionName });
    this.metaCache = opts?.enableMetaCache ? new MetaCache() : null;
  }

  // Overload for when metaOnly is explicitly true
  async findOne(args: {
    id: string;
    metaOnly: true;
  }): Promise<Pick<RepositoryDoc<TData>, "meta"> | null>;
  // Overload for when metaOnly is false or undefined (the default case)
  async findOne(args: {
    id: string;
    metaOnly?: false;
  }): Promise<RepositoryDoc<TData> | null>;
  async findOne<TMetaOnly extends boolean>(args: {
    id: string;
    metaOnly?: TMetaOnly;
  }): Promise<ProjectedRepositoryDoc<TData, TMetaOnly> | null> {
    this.logger.debug(
      { id: args.id, metaOnly: args.metaOnly },
      "finding document",
    );

    // Serve from cache only for meta-only reads. A full read needs `data`,
    // which the cache does not hold.
    if (args.metaOnly) {
      const cached = this.metaCache?.get(args.id);
      if (cached) {
        return { meta: cached } as ProjectedRepositoryDoc<TData, TMetaOnly>;
      }
    }

    const query = this.queries.findOne(args);
    const result = await this.collection.findOne(query.filter, query.options);

    if (!result) {
      this.logger.warn({ id: args.id }, "document not found");
      return null;
    }

    // Warm the cache from any read, meta-only or full document.
    this.metaCache?.set(args.id, result.meta);

    return result;
  }

  // Overload for when metaOnly is explicitly true
  async findMany(args: {
    metaOnly: true;
    orderBy?: OrderByMeta;
  }): Promise<Pick<RepositoryDoc<TData>, "meta">[]>;
  // Overload for when metaOnly is false or undefined (the default case)
  async findMany(args: {
    metaOnly?: false;
    orderBy?: OrderByMeta;
  }): Promise<RepositoryDoc<TData>[]>;
  async findMany<TMetaOnly extends boolean>(args: {
    metaOnly?: TMetaOnly;
    orderBy?: OrderByMeta;
  }): Promise<ProjectedRepositoryDoc<TData, TMetaOnly>[]> {
    const query = this.queries.findMany(args);
    const cursor = await this.collection.find(query.filter, query.options);
    if (query.sort) cursor.sort(query.sort);
    return cursor.toArray();
  }

  async insertOne(args: { data: TData }): Promise<RepositoryDoc<TData> | null> {
    const doc = {
      meta: makeDocumentMeta(),
      data: args.data,
    };
    const result = await this.collection.insertOne(doc);

    if (result.insertedId) {
      this.metaCache?.set(doc.meta.id, doc.meta);
      this.logger.info({ id: doc.meta.id }, "document inserted");
      return doc;
    } else {
      this.logger.error({}, "insert failed");
      return null;
    }
  }

  async updateOne(args: {
    id: string;
    data: TData;
    version?: number;
  }): Promise<UpdateResult> {
    const updatedAt = new Date().toISOString();
    const query = this.queries.updateOne(args);
    const update = {
      $set: {
        data: args.data,
        "meta.updatedAt": updatedAt,
      },
      $inc: { "meta.version": 1 },
    };
    const result = await this.collection.updateOne(query.filter, update);

    if (result.matchedCount === 0) {
      this.logger.warn(
        { id: args.id, expectedVersion: args.version },
        "version conflict",
      );
    } else {
      // Invalidate cache, don't update. A new meta should prompt a full query
      // any way.
      this.metaCache?.evict(args.id);
      this.logger.debug(
        { id: args.id, matched: result.matchedCount },
        "document updated",
      );
    }

    return result;
  }

  async deleteOne(args: { id: string }): Promise<DeleteResult> {
    const query = this.queries.deleteOne(args);
    const result = await this.collection.deleteOne(query.filter);

    if (result.deletedCount > 0) this.metaCache?.evict(args.id);

    this.logger.info(
      { id: args.id, deleted: result.deletedCount },
      "document deleted",
    );

    return result;
  }
}
