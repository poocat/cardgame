/**
 * Per-route metadata for search engines.
 *
 * Kept as one map rather than declared inside each route component, because
 * the same data drives things a component cannot: `robots.txt` and
 * `sitemap.xml` are generated from it at build time, so it has to be readable
 * from Node.
 *
 * That is also why it lives here rather than alongside the hook in `meta.ts` —
 * importing that module outside a browser would execute `head.ts`, which reads
 * `document` at module scope. This file must stay free of runtime imports.
 *
 * Note the division of labour with `PageTitle`, which declares the document
 * title from inside the route. Titles can depend on runtime data — a game's
 * title could name an opponent — whereas a route's description and its
 * indexability are fixed per pattern, and only fixed data can be read by a
 * build script.
 */

import type { MessageKey } from "@common/text/types";

export type RouteMeta = {
  /** Resolved against the locale bundle and published as the description. */
  description?: MessageKey;
  /** Whether crawlers should be invited to index the route. */
  index: boolean;
};

export const ROUTE_META = {
  "/": { description: "page.home.meta.description", index: true },
  "/rulebook": { description: "page.rulebook.meta.description", index: true },
  "/cards": { description: "page.cards.meta.description", index: true },
  "/about": { description: "page.about.meta.description", index: true },
  // Withheld from search. Game state is transient, so an indexed game is a
  // dead link by the time anyone follows it, and a room URL is in effect a
  // private invitation to join.
  "/games": { index: false },
  "/games/:gameId": { index: false },
  "/rooms/:roomId": { index: false },
} as const satisfies Record<string, RouteMeta>;

/******************************************************************************
 * ### indexablePaths
 *
 * The concrete paths that belong in a sitemap: indexable, and static enough to
 * name a single URL. Patterns with parameters are skipped, having no one path
 * to list.
 ******************************************************************************/
export function indexablePaths(): string[] {
  return Object.entries(ROUTE_META)
    .filter(([pattern, meta]) => meta.index && !pattern.includes(":"))
    .map(([pattern]) => pattern);
}

/******************************************************************************
 * ### disallowedPrefixes
 *
 * The path prefixes to withhold from crawlers, derived from the non-indexable
 * patterns. Parameter segments are trimmed, so `/rooms/:roomId` becomes the
 * prefix `/rooms`, which `robots.txt` matches against every room beneath it.
 ******************************************************************************/
export function disallowedPrefixes(): string[] {
  const prefixes = Object.entries(ROUTE_META)
    .filter(([, meta]) => !meta.index)
    .map(([pattern]) => pattern.split("/:")[0]);
  return [...new Set(prefixes)].sort();
}
