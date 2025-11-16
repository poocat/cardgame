import { Collection, DeleteResult, UpdateResult } from "mongodb";
import { makeDocumentMeta } from "@server/db/meta";
import {
  IRepo,
  OrderByMeta,
  ProjectedRepoDoc,
  RepoDoc,
} from "@server/db/types";
import { Queries } from "@server/db/utils/Queries";

export class Repo<TData> implements IRepo<TData> {
  queries: Queries<TData>;

  constructor(protected readonly collection: Collection<RepoDoc<TData>>) {
    this.collection = collection;
    this.queries = new Queries();
  }

  // Overload for when metaOnly is explicitly true
  async findOne(args: {
    id: string;
    metaOnly: true;
  }): Promise<Pick<RepoDoc<TData>, "meta"> | null>;

  // Overload for when metaOnly is false or undefined (the default case)
  async findOne(args: {
    id: string;
    metaOnly?: false;
  }): Promise<RepoDoc<TData> | null>;

  async findOne<TMetaOnly extends boolean>(args: {
    id: string;
    metaOnly?: TMetaOnly;
  }): Promise<ProjectedRepoDoc<TData, TMetaOnly> | null> {
    const query = this.queries.findOne(args);
    const result = await this.collection.findOne(query.filter, query.options);
    return result;
  }

  // Overload for when metaOnly is explicitly true
  async findMany(args: {
    metaOnly: true;
    orderBy?: OrderByMeta;
  }): Promise<Pick<RepoDoc<TData>, "meta">[]>;

  // Overload for when metaOnly is false or undefined (the default case)
  async findMany(args: {
    metaOnly?: false;
    orderBy?: OrderByMeta;
  }): Promise<RepoDoc<TData>[]>;

  async findMany<TMetaOnly extends boolean>(args: {
    metaOnly?: TMetaOnly;
    orderBy?: OrderByMeta;
  }): Promise<ProjectedRepoDoc<TData, TMetaOnly>[]> {
    const query = this.queries.findMany(args);
    const cursor = await this.collection.find(query.filter, query.options);
    if (query.sort) cursor.sort(query.sort);
    return cursor.toArray();
  }

  async insertOne(args: { data: TData }): Promise<RepoDoc<TData> | null> {
    const doc = {
      meta: makeDocumentMeta(),
      data: args.data,
    };
    const result = await this.collection.insertOne(doc);
    return result.insertedId ? doc : null;
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
    return result;
  }

  async deleteOne(args: { id: string }): Promise<DeleteResult> {
    const query = this.queries.deleteOne(args);
    const result = await this.collection.deleteOne(query.filter);
    return result;
  }
}
