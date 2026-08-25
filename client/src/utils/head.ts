/**
 * The single owner of the `<head>` elements that describe the current page to
 * crawlers: `<meta name="description">`, `<meta name="robots">`, and
 * `<link rel="canonical">`.
 *
 * Disjoint from `title.ts`, which owns `document.title` and nothing else.
 * Between them they cover every part of the head this app writes at runtime;
 * nothing else should touch it. Keeping the two modules separate is
 * deliberate — the title has a flashing overlay to arbitrate, these tags have
 * exactly one contributor each.
 *
 * Tags are upserted rather than appended, so a static tag already present in
 * `index.html` is *upgraded* in place rather than duplicated. That matters:
 * with two `<meta name="description">` elements, crawlers read the first.
 */

/**
 * The description from `index.html`, captured at module load before anything
 * here can overwrite it. Routes without a description of their own fall back
 * to it rather than stripping it.
 */
const defaultDescription =
  document.head.querySelector<HTMLMetaElement>('meta[name="description"]')
    ?.content ?? null;

function upsertMeta(name: string, content: string | null) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`,
  );
  if (content === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertLink(rel: string, href: string | null) {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`,
  );
  if (href === null) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

/******************************************************************************
 * ### setMetaDescription
 *
 * Publishes the page description. Pass `null` to fall back to the description
 * declared in `index.html`.
 ******************************************************************************/
export function setMetaDescription(content: string | null) {
  upsertMeta("description", content ?? defaultDescription);
}

/******************************************************************************
 * ### setRobots
 *
 * Publishes crawler directives, e.g. `"noindex"`. Pass `null` to remove the
 * tag, which leaves the page indexable by default.
 ******************************************************************************/
export function setRobots(content: string | null) {
  upsertMeta("robots", content);
}

/******************************************************************************
 * ### setCanonical
 *
 * Publishes the canonical URL for the page. Pass `null` to remove the tag,
 * which is the right call when the URL is unknown: an absent canonical is
 * harmless, a wrong one is not.
 ******************************************************************************/
export function setCanonical(href: string | null) {
  upsertLink("canonical", href);
}
