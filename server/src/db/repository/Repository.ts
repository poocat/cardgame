import { makeDocumentMeta } from "@server/db/meta";
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
 * Provides CRUD operations on a MongoDB collection based on a particular
 * schema for document metadata.
 ******************************************************************************/
export class Repository<TData> implements IRepository<TData> {
  queries: Queries<TData>;
  private logger;

  constructor(protected readonly collection: Collection<RepositoryDoc<TData>>) {
    this.collection = collection;
    this.queries = new Queries();
    this.logger = makeChildLogger({ collection: collection.collectionName });
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
    const query = this.queries.findOne(args);
    const result = await this.collection.findOne(query.filter, query.options);

    if (!result) {
      this.logger.warn({ id: args.id }, "document not found");
    }

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

    this.logger.info(
      { id: args.id, deleted: result.deletedCount },
      "document deleted",
    );

    return result;
  }
}
