/**
 * Conditional-GET (RFC 7232) helpers.
 *
 * Certain endpoints implement the "conditional get" pattern to support
 * polling. These endpoints will generate an ETag from the resource metadata,
 * but proxies/CDNs will weaken strong validators (e.g. `<etag>` becomes
 * `W/"<etag>"`).
 */

/** Strip an optional weak-validator prefix so weak comparison can be used. */
function normalizeEtag(tag: string): string {
  return tag.trim().replace(/^W\//, "");
}

/******************************************************************************
 * Returns true when an `If-None-Match` request header matches `etag` under
 * RFC 7232 weak comparison, and should signal the handler to respond with
 * `304`.
 *
 * Handles: absent header, `*`, comma-separated lists, and `W/`-weakened tags
 * (as introduced by compressing proxies).
 ******************************************************************************/
export function ifNoneMatchSatisfied(
  header: string | undefined,
  etag: string,
): boolean {
  if (!header) return false;
  if (header.trim() === "*") return true;

  const target = normalizeEtag(etag);
  return header.split(",").some((tag) => normalizeEtag(tag) === target);
}
