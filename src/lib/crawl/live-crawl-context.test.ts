import { describe, expect, it } from "vitest";
import { mergeLiveCrawlContext, type LiveCrawlPoll } from "./live-crawl-context";
import type { ChatPageContext } from "@/types/chat";

const baseContext: ChatPageContext = {
  httpsUrl: "https://example.com",
  canonicalKey: "example.com",
  siteRootKey: "example.com",
  indexed: true,
  crawlStatus: "completed",
  crawledPageCount: 15,
  discoveredPageCount: 20,
  indexedPages: ["/", "/about"],
  recentPages: ["/about"],
};

const liveZeros: LiveCrawlPoll = {
  status: "pending",
  crawled: 0,
  discovered: 0,
  indexed: 0,
  recentPages: [],
  indexedPages: [],
};

describe("mergeLiveCrawlContext", () => {
  it("does not fall back to old crawledPageCount when live crawled is 0", () => {
    const merged = mergeLiveCrawlContext(
      { ...baseContext, crawlStatus: "running" },
      liveZeros
    );
    expect(merged.crawledPageCount).toBe(0);
  });

  it("does not fall back to old discoveredPageCount when live discovered is 0", () => {
    const merged = mergeLiveCrawlContext(
      { ...baseContext, crawlStatus: "running" },
      liveZeros
    );
    expect(merged.discoveredPageCount).toBe(0);
  });

  it("uses empty indexedPages when preferLiveCounts is true", () => {
    const merged = mergeLiveCrawlContext(
      { ...baseContext, crawlStatus: "running" },
      liveZeros,
      { preferLiveCounts: true }
    );
    expect(merged.indexedPages).toEqual([]);
    expect(merged.recentPages).toEqual([]);
  });

  it("falls back to base indexedPages when live list is empty and preferLiveCounts is false", () => {
    const merged = mergeLiveCrawlContext(
      { ...baseContext, crawlStatus: "running" },
      liveZeros
    );
    expect(merged.indexedPages).toEqual(["/", "/about"]);
  });

  it("uses indexed count during indexing phase", () => {
    const merged = mergeLiveCrawlContext(
      { ...baseContext, crawlStatus: "running" },
      {
        ...liveZeros,
        status: "indexing",
        crawled: 10,
        indexed: 7,
        discovered: 17,
      }
    );
    expect(merged.crawledPageCount).toBe(7);
    expect(merged.discoveredPageCount).toBe(10);
  });
});
