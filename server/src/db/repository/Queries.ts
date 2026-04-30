/**
 * Utility for configuring MongoDB CRUD operations that assume a "metadata
 * schema" that includes the unique id, create/update timestamps, and a version
 * number
 */
import type { IQueries, OrderByMeta } from "@server/db/types";
import type { Document, Sort } from "mongodb";

export class Queries<TData = unknown> implements IQueries<TData> {
  private metaOnlyProjection: Document = {
    meta: true,
    _id: false,
  };

  private makeSort(orderBy: OrderByMeta | undefined): Sort | null {
    switch (orderBy) {
      case "update timestamp desc":
        return { "meta.updatedAt": -1 };
      default:
        return null;
    }
  }

  findOne(args: { id: string; metaOnly?: boolean }) {
    return {
      filter: { "meta.id": { $eq: args.id } },
      options: args.metaOnly ? { projection: this.metaOnlyProjection } : {},
      sort: null,
    };
  }

  findMany(args: { metaOnly?: boolean; orderBy?: OrderByMeta }) {
    return {
      filter: {},
      options: args.metaOnly ? { projection: this.metaOnlyProjection } : {},
      sort: this.makeSort(args.orderBy),
    };
  }

  updateOne(args: { id: string; data: unknown; version?: number }) {
    return {
      filter: {
        "meta.id": { $eq: args.id },
        ...(args.version ? { "meta.version": { $eq: args.version } } : {}),
      },
      options: {},
      sort: null,
    };
  }

  deleteOne(args: { id: string }) {
    return {
      filter: { "meta.id": { $eq: args.id } },
      options: {},
      sort: null,
    };
  }
}
