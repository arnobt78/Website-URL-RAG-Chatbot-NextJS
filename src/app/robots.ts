import type { MetadataRoute } from "next";

/**
 * Single crawl policy for this App Router app (do not also add public/robots.txt).
 * Allows the homepage; blocks API + Next internals and known AI scrapers.
 * High-cardinality /[...url] chat routes are additionally noindex via page metadata.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/_next/", "/api/"],
      },
      // AI crawlers — deny indexing/scraping of the public demo surface.
      { userAgent: "GPTBot", disallow: ["/"] },
      { userAgent: "ChatGPT-User", disallow: ["/"] },
      { userAgent: "Google-Extended", disallow: ["/"] },
      { userAgent: "CCBot", disallow: ["/"] },
      { userAgent: "anthropic-ai", disallow: ["/"] },
      { userAgent: "ClaudeBot", disallow: ["/"] },
    ],
  };
}
