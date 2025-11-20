import { DeleteResult, Document, Filter, Sort, UpdateResult } from "mongodb";
import z from "zod";
import { documentMetaSchema } from "@server/db/meta";
import { GameData } from "@server/types";

type RepoDocMeta = z.infer<typeof documentMetaSchema>;

export type RepositoryDoc<TData> = { meta: RepoDocMeta; data: TData };
export type ProjectedRepositoryDoc<
  TData,
  TMetaOnly extends boolean,
> = TMetaOnly extends true
  ? Pick<RepositoryDoc<TData>, "meta">
  : RepositoryDoc<TData>;
export type OrderByMeta = "update timestamp desc";

type RepositoryMethodArgs<TData> = {
  findOne: { id: string; metaOnly?: boolean };
  findMany: { metaOnly?: boolean; orderBy?: OrderByMeta };
  insertOne: { data: TData };
  updateOne: { id: string; data: TData; version?: number };
  deleteOne: { id: string };
};
type RepositoryMethods<TData, TReturnType> = {
  [M in keyof RepositoryMethodArgs<TData>]: (
    args: RepositoryMethodArgs<TData>[M],
  ) => TReturnType;
};

type Query<TData> = {
  filter: Filter<RepositoryDoc<TData>>;
  options: Document;
  sort: Sort | null;
};

export type IQueries<TData> = Omit<
  RepositoryMethods<unknown, Query<TData>>,
  "insertOne"
>;

export interface IRepository<TData>
  extends RepositoryMethods<TData, Promise<unknown>> {
  findOne<TMetaOnly extends boolean>(args: {
    id: string;
    metaOnly?: TMetaOnly;
  }): Promise<ProjectedRepositoryDoc<TData, TMetaOnly> | null>;

  findMany<TMetaOnly extends boolean>(args: {
    metaOnly?: TMetaOnly;
    orderBy?: OrderByMeta;
  }): Promise<ProjectedRepositoryDoc<TData, TMetaOnly>[]>;

  insertOne(args: { data: TData }): Promise<RepositoryDoc<TData> | null>;

  updateOne(args: {
    id: string;
    data: TData;
    version?: number;
  }): Promise<UpdateResult>;

  deleteOne(args: { id: string }): Promise<DeleteResult>;
}

////////////////////////////////////////////////////////////////////////////////
// Game Document
////////////////////////////////////////////////////////////////////////////////
export type GameDoc = RepositoryDoc<GameData>;

////////////////////////////////////////////////////////////////////////////////
// Room Document
////////////////////////////////////////////////////////////////////////////////
type RoomPlayer = { id: string; name: string };
type RoomData = {
  gameId: string | null;
  host: RoomPlayer;
  guests: RoomPlayer[];
};
export type RoomDoc = RepositoryDoc<RoomData>;
