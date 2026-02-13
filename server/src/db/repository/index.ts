/**
 * A generic repository implementation that wraps MongoDB collections with
 * a particular metadata schema.
 *
 * Provides type-safe CRUD operations (e.g. findOne, findMany, insertOne,
 * updateOne, deleteOne).
 *
 * Manages document metadata like unique IDs, version numbers, and timestamps
 * Supports optimistic concurrency via version checking on updates, and offers
 * "meta only" projections for lightweight queries that omit the data payload.
 */

export { Repository } from "./Repository";
