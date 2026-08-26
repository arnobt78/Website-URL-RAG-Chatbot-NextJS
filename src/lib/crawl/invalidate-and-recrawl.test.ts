import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  allowCrawlRequest: vi.fn(),
  isFirecrawlConfigured: vi.fn(),
  isWorkflowConfigured: vi.fn(),
  runWithRagChatFallback: vi.fn(),
  redisSrem: vi.fn(),
  deleteCrawlJob: vi.fn(),
  deleteIndexSnapshot: vi.fn(),
  startSiteCrawl: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  allowCrawlRequest: mocks.allowCrawlRequest,
}));

vi.mock("@/lib/crawl/config", () => ({
  isFirecrawlConfigured: mocks.isFirecrawlConfigured,
  isWorkflowConfigured: mocks.isWorkflowConfigured,
}));

vi.mock("@/lib/ai/fallback-rag-chat", () => ({
  runWithRagChatFallback: mocks.runWithRagChatFallback,
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    srem: mocks.redisSrem,
  },
}));

vi.mock("@/lib/crawl/crawl-job-store", () => ({
  deleteCrawlJob: mocks.deleteCrawlJob,
}));

vi.mock("@/lib/crawl/index-snapshot", () => ({
  deleteIndexSnapshot: mocks.deleteIndexSnapshot,
}));

vi.mock("@/lib/crawl/site-crawl", () => ({
  startSiteCrawl: mocks.startSiteCrawl,
}));

import { recrawlSite } from "@/lib/crawl/invalidate-and-recrawl";

const args = {
  siteRootKey: "example.com",
  namespace: "abc123",
  clientIp: "127.0.0.1",
};

describe("recrawlSite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isFirecrawlConfigured.mockReturnValue(true);
    mocks.isWorkflowConfigured.mockReturnValue(true);
    mocks.runWithRagChatFallback.mockResolvedValue({
      ok: true,
      result: undefined,
    });
    mocks.redisSrem.mockResolvedValue(1);
    mocks.deleteCrawlJob.mockResolvedValue(undefined);
    mocks.deleteIndexSnapshot.mockResolvedValue(undefined);
    mocks.startSiteCrawl.mockResolvedValue({
      ok: true,
      job: {
        status: "pending",
        siteRootKey: "example.com",
        siteOriginUrl: "https://example.com/",
        namespace: "abc123",
        discovered: 0,
        crawled: 0,
        indexed: 0,
        failed: 0,
        startedAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
  });

  it("does not invalidate the index when rate limited", async () => {
    mocks.allowCrawlRequest.mockResolvedValue(false);

    const result = await recrawlSite(args);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.ingestError).toContain("Too many site crawl requests");
    }
    expect(mocks.runWithRagChatFallback).not.toHaveBeenCalled();
    expect(mocks.startSiteCrawl).not.toHaveBeenCalled();
  });

  it("invalidates then starts crawl with force and skipRateLimit when preflight passes", async () => {
    mocks.allowCrawlRequest.mockResolvedValue(true);

    const result = await recrawlSite(args);

    expect(result.ok).toBe(true);
    expect(mocks.runWithRagChatFallback).toHaveBeenCalledTimes(1);
    expect(mocks.redisSrem).toHaveBeenCalledWith("indexed-urls", expect.stringContaining("example.com"));
    expect(mocks.deleteCrawlJob).toHaveBeenCalledWith("example.com");
    expect(mocks.deleteIndexSnapshot).toHaveBeenCalledWith("example.com");
    expect(mocks.startSiteCrawl).toHaveBeenCalledWith({
      ...args,
      force: true,
      skipRateLimit: true,
    });
  });
});
