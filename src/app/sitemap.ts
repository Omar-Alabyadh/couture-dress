import type { MetadataRoute } from "next";

const SITE = "https://www.couture-dress.com";

/** Stable timestamp so sitemap output does not churn on every deploy. */
const LAST_MODIFIED = new Date("2026-05-01T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE}/products`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
