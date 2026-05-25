/**
 * Certain endpoints implement the "conditional get" pattern to support
 * polling, by emitting ETags from the resource metadata, and checking
 * for a match in `If-None-Match` headers.
 *
 * As per the RFC 7232 standard, ETag matching must use a "weak comparison
 * algorithm", to establish that the content is equivalent, even if the data
 * is not a byte-by-byte match.
 */

/**
 * Strip an optional weak-validator prefix so weak comparison can be used.
 */
function normalizeEtag(tag: string): string {
  return tag.trim().replace(/^W\//, "");
}

/******************************************************************************
 * ### matchesHeader
 *
 * Returns true when the given `If-None-Match` request header matches the given
 * `etag` under RFC 7232 weak comparison. Should signal the request handler to
 * respond with `304`.
 *
 * Handles absent header, `*`, comma-separated lists, and `W/`-weakened tags
 * (as introduced by compressing proxies).
 ******************************************************************************/
export function matchesHeader(
  header: string | undefined,
  etag: string,
): boolean {
  if (!header) return false;
  if (header.trim() === "*") return true;

  const target = normalizeEtag(etag);
  return header.split(",").some((tag) => normalizeEtag(tag) === target);
}
