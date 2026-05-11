import DOMPurify from "isomorphic-dompurify";

/** Rich snippets allowed in hero title / about blocks (admin-edited landing JSON). */
const LANDING_HTML_CONFIG = {
  ALLOWED_TAGS: [
    "a",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "br",
    "span",
    "p",
    "small",
    "sub",
    "sup",
    "ul",
    "ol",
    "li",
  ],
  ALLOWED_ATTR: ["class", "href", "target", "rel", "dir"],
  ALLOW_DATA_ATTR: false,
};

/** Inline-only: used for HTML injected inside `<h1>` to avoid invalid nesting (e.g. `<p>` in `<h1>`). */
const LANDING_HERO_TITLE_HTML_CONFIG = {
  ALLOWED_TAGS: [
    "a",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "br",
    "span",
    "small",
    "sub",
    "sup",
  ],
  ALLOWED_ATTR: ["class", "href", "target", "rel", "dir"],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeLandingHtmlFragment(html: string): string {
  return DOMPurify.sanitize(html, LANDING_HTML_CONFIG);
}

export function sanitizeLandingHeroTitleHtml(html: string): string {
  return DOMPurify.sanitize(html, LANDING_HERO_TITLE_HTML_CONFIG);
}
