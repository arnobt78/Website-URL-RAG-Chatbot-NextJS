import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateCrawlJob } from "@/lib/crawl/crawl-job-store";
import { firecrawlInteract, firecrawlScrapeForInteract, firecrawlScrapeUrl } from "@/lib/crawl/firecrawl-client";
import { scrapeCrawlTargets } from "./scrape-targets";

vi.mock("@/lib/crawl/crawl-job-store", () => ({
  updateCrawlJob: vi.fn(),
}));

vi.mock("@/lib/crawl/config", () => ({
  getCrawlInteractEnabled: () => true,
  getCrawlInteractMaxPages: () => 8,
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
  firecrawlScrapeForInteract: vi.fn().mockResolvedValue({
    scrapeId: "sid",
    page: { markdown: "x".repeat(200), sourceUrl: "https://example.com/page" },
  }),
  firecrawlInteract: vi.fn().mockResolvedValue({
    markdown: "y".repeat(200),
    sourceUrl: "interact:sid",
    label: "interact",
  }),
}));

describe("scrapeCrawlTargets", () => {
  beforeEach(() => {
    vi.mocked(updateCrawlJob).mockClear();
    vi.mocked(firecrawlScrapeUrl).mockClear();
    vi.mocked(firecrawlInteract).mockClear();
    vi.mocked(firecrawlScrapeForInteract).mockClear();
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

  it("threads interactRemaining across calls and decrements on preferInteract", async () => {
    const prefer = {
      url: "https://example.com/faq",
      variantKey: "faq-x",
      label: "FAQ expanded",
      preferInteract: true,
    };

    const first = await scrapeCrawlTargets([prefer], "example.com", 0, undefined, 2);
    expect(first.interactRemaining).toBe(1);
    expect(firecrawlInteract).toHaveBeenCalledTimes(1);

    const second = await scrapeCrawlTargets([prefer], "example.com", 0, undefined, first.interactRemaining);
    expect(second.interactRemaining).toBe(0);

    const third = await scrapeCrawlTargets([prefer], "example.com", 0, undefined, 0);
    expect(third.interactRemaining).toBe(0);
    expect(firecrawlInteract).toHaveBeenCalledTimes(2);
  });

  it("disables onlyMainContent when harvest actions are present", async () => {
    await scrapeCrawlTargets(
      [
        {
          url: "https://example.com/faq",
          variantKey: "faq-h",
          label: "FAQ expanded",
          actions: [
            {
              type: "executeJavascript",
              script: "document.getElementById('rag-crawl-harvest')",
            },
          ],
        },
      ],
      "example.com",
      0,
      undefined,
      0
    );

    expect(firecrawlScrapeUrl).toHaveBeenCalledWith(
      "https://example.com/faq",
      expect.objectContaining({ onlyMainContent: false })
    );
  });
});
