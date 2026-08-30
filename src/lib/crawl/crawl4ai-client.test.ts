import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCrawl4aiBaseUrl: vi.fn((): string | undefined => "http://localhost:11235"),
  getCrawl4aiApiToken: vi.fn((): string | undefined => "test-token"),
}));

vi.mock("@/lib/crawl/config", () => ({
  getCrawl4aiBaseUrl: mocks.getCrawl4aiBaseUrl,
  getCrawl4aiApiToken: mocks.getCrawl4aiApiToken,
}));

import { crawl4aiMapSite, crawl4aiScrapeUrl } from "@/lib/crawl/crawl4ai-client";

describe("crawl4ai-client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    mocks.getCrawl4aiBaseUrl.mockReturnValue("http://localhost:11235");
    mocks.getCrawl4aiApiToken.mockReturnValue("test-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("maps a site via /crawl and collects links", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        results: [
          {
            url: "https://example.com/",
            markdown: "# Home",
            links: {
              internal: ["https://example.com/about", { href: "https://example.com/faq" }],
            },
          },
        ],
      }),
    } as Response);

    const links = await crawl4aiMapSite("https://example.com/");
    expect(links).toContain("https://example.com/");
    expect(links).toContain("https://example.com/about");
    expect(links).toContain("https://example.com/faq");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:11235/crawl",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("scrapes markdown via /md", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        markdown: "# Hello world content here",
        url: "https://example.com/",
      }),
    } as Response);

    const result = await crawl4aiScrapeUrl("https://example.com/");
    expect(result.page?.markdown).toContain("Hello world");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:11235/md",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("uses /crawl with js_code when executeJavascript actions are present", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        results: [
          {
            url: "https://example.com/faq",
            markdown: { raw_markdown: "x".repeat(150) },
            metadata: { title: "FAQ" },
          },
        ],
      }),
    } as Response);

    const result = await crawl4aiScrapeUrl("https://example.com/faq", {
      actions: [{ type: "executeJavascript", script: "/* rag-crawl-harvest */" }],
      waitFor: 2000,
    });

    expect(result.page?.markdown.length).toBeGreaterThanOrEqual(100);
    expect(result.page?.title).toBe("FAQ");
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit).body as string
    );
    expect(body.crawler_config.params.js_code).toEqual(["/* rag-crawl-harvest */"]);
  });

  it("throws when API token is missing", async () => {
    mocks.getCrawl4aiApiToken.mockReturnValue(undefined);
    await expect(crawl4aiMapSite("https://example.com")).rejects.toThrow(
      "CRAWL4AI_API_TOKEN"
    );
  });

  it("throws on HTTP error responses", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Unauthorized" }),
    } as Response);

    await expect(crawl4aiScrapeUrl("https://example.com/")).rejects.toThrow("Unauthorized");
  });
});
