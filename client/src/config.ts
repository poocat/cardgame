export const CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
  /**
   * The site's public origin, e.g. `https://example.com`. Used to build
   * absolute canonical URLs.
   *
   * Deliberately not derived from `window.location.origin`: deduplicating
   * `www` against apex, and preview deploys against production, is most of
   * what a canonical URL is for, and a self-referential one does none of it.
   * Left empty, no canonical is published at all.
   */
  siteUrl: import.meta.env.VITE_SITE_URL ?? "",
} as const;
