/**
 * Applies the per-route metadata in `meta.data.ts` to the live document.
 *
 * The map itself lives in a separate module so the build can read it without
 * a browser; see the note there.
 */

import { CONFIG } from "@client/config";
import type { RouteMeta } from "@client/routes/meta.data";
import { ROUTE_META } from "@client/routes/meta.data";
import {
  setCanonical,
  setMetaDescription,
  setRobots,
} from "@client/utils/head";
import { useMessages } from "@client/utils/messages";
import { useEffect, useMemo } from "react";
import { matchPath, useLocation } from "react-router";

function matchRouteMeta(pathname: string): RouteMeta | null {
  for (const [pattern, meta] of Object.entries(ROUTE_META)) {
    if (matchPath(pattern, pathname)) return meta;
  }
  return null;
}

function canonicalUrl(pathname: string): string | null {
  if (!CONFIG.siteUrl) return null;
  try {
    return new URL(pathname, CONFIG.siteUrl).href;
  } catch {
    return null;
  }
}

/******************************************************************************
 * ### useRouteMeta
 *
 * Publishes the description, crawler directives, and canonical URL for the
 * active route. Call once, from the layout; it reads the location itself.
 ******************************************************************************/
export function useRouteMeta() {
  const { pathname } = useLocation();
  const { lookup } = useMessages();

  const meta = useMemo(() => matchRouteMeta(pathname), [pathname]);

  const description = useMemo(() => {
    const key = meta?.description;
    if (!key) return null;
    const match = lookup(key, { textOnly: true });
    // `lookup` echoes the key back when the bundle has no entry for it. That
    // is a serviceable placeholder on screen, but publishing it would put
    // "meta.cards.description" under the search result, so treat it as absent.
    return match.value === key ? null : match.value;
  }, [meta, lookup]);

  // An unmatched path is a mistake rather than a page — there is no 404 route
  // — so withhold it from search rather than inviting it in by default.
  const indexable = meta?.index ?? false;

  useEffect(() => {
    setMetaDescription(description);
    setRobots(indexable ? null : "noindex");
    setCanonical(indexable ? canonicalUrl(pathname) : null);
  }, [description, indexable, pathname]);
}
