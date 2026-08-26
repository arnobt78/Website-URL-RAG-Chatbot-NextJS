import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateCrawlJob } from "@/lib/crawl/crawl-job-store";
import { scrapeCrawlTargets } from "./scrape-targets";

vi.mock("@/lib/crawl/crawl-job-store", () => ({
  updateCrawlJob: vi.fn(),
}));

vi.mock("@/lib/crawl/config", () => ({
  getCrawlInteractEnabled: () => false,
  getCrawlInteractMaxPages: () => 0,
  getCrawlMaxActionsPerPage: () => 8,
}));

vi.mock("@/lib/crawl/firecrawl-client", () => ({
  MIN_SCRAPE_CHARS: 100,
  firecrawlScrapeUrl: vi.fn().mockResolvedValue({
    page: {
      markdown: "x".repeat(200),
      sourceUrl: "https://example.com/page",
      title: "Page",
    },
  }),
  firecrawlScrapeForInteract: vi.fn(),
  firecrawlInteract: vi.fn(),
}));

describe("scrapeCrawlTargets", () => {
  beforeEach(() => {
    vi.mocked(updateCrawlJob).mockClear();
  });

  it("adds crawledOffset to progress updates across a batch", async () => {
    const targets = [
      { url: "https://example.com/a", variantKey: "a" },
      { url: "https://example.com/b", variantKey: "b" },
    ];

    await scrapeCrawlTargets(targets, "example.com", 4);

    const crawledValues = vi
      .mocked(updateCrawlJob)
      .mock.calls.map((call) => call[1]?.crawled)
      .filter((n): n is number => typeof n === "number");

    expect(crawledValues).toContain(4);
    expect(crawledValues).toContain(5);
    expect(crawledValues).toContain(6);
    expect(crawledValues).not.toContain(1);
  });
});
