import sanitizeHtml from "sanitize-html";

const LANDING_TAGS_FRAGMENT = [
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
] as const;

/** Inline-only: used for HTML injected inside `<h1>`. */
const LANDING_TAGS_HERO = [
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
] as const;

function landingSanitizeOptions(
  allowedTags: readonly string[],
): sanitizeHtml.IOptions {
  return {
    allowedTags: [...allowedTags],
    allowedAttributes: {
      a: ["href", "target", "rel", "class", "dir"],
      "*": ["class", "dir"],
    },
    allowProtocolRelative: false,
  };
}

export function sanitizeLandingHtmlFragment(html: string): string {
  return sanitizeHtml(html, landingSanitizeOptions(LANDING_TAGS_FRAGMENT));
}

export function sanitizeLandingHeroTitleHtml(html: string): string {
  return sanitizeHtml(html, landingSanitizeOptions(LANDING_TAGS_HERO));
}
