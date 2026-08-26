import { describe, expect, it } from "vitest";

import { prioritizeSiteUrls, selectUrlsForCrawl } from "@/lib/crawl/url-prioritizer";

describe("prioritizeSiteUrls", () => {
  it("ranks homepage and about pages above tag pages", () => {
    const urls = [
      "https://example.com/tag/react",
      "https://example.com/about",
      "https://example.com/",
      "https://example.com/contact",
    ];

    const ordered = prioritizeSiteUrls(urls, "https://example.com/");
    expect(ordered[0]).toBe("https://example.com/");
    expect(ordered.slice(0, 3)).toEqual([
      "https://example.com/",
      "https://example.com/about",
      "https://example.com/contact",
    ]);
  });

  it("filters cross-origin links", () => {
    const urls = ["https://example.com/about", "https://other.com/secret"];
    const ordered = prioritizeSiteUrls(urls, "https://example.com/");
    expect(ordered).toEqual(["https://example.com/about"]);
  });
});

describe("selectUrlsForCrawl", () => {
  it("returns all URLs when under max", () => {
    const urls = ["https://example.com/", "https://example.com/about"];
    expect(selectUrlsForCrawl(urls, 10)).toEqual(urls);
  });

  it("caps URLs at max pages", () => {
    const urls = Array.from({ length: 20 }, (_, i) => `https://example.com/p${i}`);
    expect(selectUrlsForCrawl(urls, 5)).toHaveLength(5);
  });
});
