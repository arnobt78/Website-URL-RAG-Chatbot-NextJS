import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Landing-only sitemap. High-cardinality /[...url] chat routes are noindex
 * and must not be enumerated here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
