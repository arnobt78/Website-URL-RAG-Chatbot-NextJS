import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getFirecrawlApiKey: vi.fn((): string | undefined => "fc-test-key"),
}));

vi.mock("@/lib/crawl/config", () => ({
  getFirecrawlApiKey: mocks.getFirecrawlApiKey,
}));

import {
  firecrawlMapSite,
  firecrawlScrapeUrl,
} from "./firecrawl-client";

describe("firecrawl-client (mocked fetch)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    mocks.getFirecrawlApiKey.mockReturnValue("fc-test-key");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps a site and returns links", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        links: ["https://example.com/", "https://example.com/about"],
      }),
    });

    const links = await firecrawlMapSite("https://example.com");
    expect(links).toEqual(["https://example.com/", "https://example.com/about"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.firecrawl.dev/v1/map",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer fc-test-key",
        }),
      })
    );
  });

  it("throws when map reports failure", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: "map quota exceeded" }),
    });

    await expect(firecrawlMapSite("https://example.com")).rejects.toThrow(
      "map quota exceeded"
    );
  });

  it("scrapes markdown and links", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          markdown: "# Hello\n\nWorld",
          links: ["https://example.com/next"],
          metadata: { title: "Hello", sourceURL: "https://example.com/" },
        },
      }),
    });

    const result = await firecrawlScrapeUrl("https://example.com/");
    expect(result.page?.markdown).toContain("Hello");
    expect(result.page?.sourceUrl).toBe("https://example.com/");
    expect(result.links).toEqual(["https://example.com/next"]);
  });

  it("throws on HTTP error from Firecrawl", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    await expect(firecrawlScrapeUrl("https://example.com/")).rejects.toThrow(
      "Unauthorized"
    );
  });

  it("throws when API key is missing", async () => {
    mocks.getFirecrawlApiKey.mockReturnValue(undefined);
    await expect(firecrawlMapSite("https://example.com")).rejects.toThrow(
      "FIRECRAWL_API_KEY is not configured."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
