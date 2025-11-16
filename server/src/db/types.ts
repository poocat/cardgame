import { DeleteResult, Document, Filter, Sort, UpdateResult } from "mongodb";
import z from "zod";
import { documentMetaSchema } from "@server/db/meta";
import { GameData } from "@common/game/types";

export type RepoDocMeta = z.infer<typeof documentMetaSchema>;
export type RepoDoc<TData> = { meta: RepoDocMeta; data: TData };
export type ProjectedRepoDoc<
  TData,
  TMetaOnly extends boolean,
> = TMetaOnly extends true ? Pick<RepoDoc<TData>, "meta"> : RepoDoc<TData>;
export type OrderByMeta = "update timestamp desc";

type RepoMethodArgs<TData> = {
  findOne: { id: string; metaOnly?: boolean };
  findMany: { metaOnly?: boolean; orderBy?: OrderByMeta };
  insertOne: { data: TData };
  updateOne: { id: string; data: TData; version?: number };
  deleteOne: { id: string };
};
type RepoMethods<TData, TReturnType> = {
  [M in keyof RepoMethodArgs<TData>]: (
    args: RepoMethodArgs<TData>[M],
  ) => TReturnType;
};

export type Query<TData> = {
  filter: Filter<RepoDoc<TData>>;
  options: Document;
  sort: Sort | null;
};

export type IQueries<TData> = Omit<
  RepoMethods<unknown, Query<TData>>,
  "insertOne"
>;

export interface IRepo<TData> extends RepoMethods<TData, Promise<unknown>> {
  findOne<TMetaOnly extends boolean>(args: {
    id: string;
    metaOnly?: TMetaOnly;
  }): Promise<ProjectedRepoDoc<TData, TMetaOnly> | null>;

  findMany<TMetaOnly extends boolean>(args: {
    metaOnly?: TMetaOnly;
    orderBy?: OrderByMeta;
  }): Promise<ProjectedRepoDoc<TData, TMetaOnly>[]>;

  insertOne(args: { data: TData }): Promise<RepoDoc<TData> | null>;

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
export type GameDoc = RepoDoc<GameData>;

////////////////////////////////////////////////////////////////////////////////
// Room Document
////////////////////////////////////////////////////////////////////////////////
type RoomPlayer = { id: string; name: string };
type RoomData = {
  gameId: string | null;
  host: RoomPlayer;
  guests: RoomPlayer[];
};
export type RoomDoc = RepoDoc<RoomData>;
