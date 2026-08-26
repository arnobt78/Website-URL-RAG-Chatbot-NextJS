import { describe, expect, it } from "vitest";

import { crawlStatusPollFailure } from "@/lib/crawl/status-poll-errors";

describe("crawlStatusPollFailure", () => {
  it("stops polling on 403 with session message", () => {
    const result = crawlStatusPollFailure(403);
    expect(result.title).toBe("Crawl progress unavailable");
    expect(result.subtitle).toContain("Session required");
    expect(result.stopPolling).toBe(true);
  });

  it("uses API error text on 403 when provided", () => {
    const result = crawlStatusPollFailure(403, "Custom forbidden.");
    expect(result.subtitle).toBe("Custom forbidden.");
    expect(result.stopPolling).toBe(true);
  });

  it("keeps polling on 429 with slow-progress message", () => {
    const result = crawlStatusPollFailure(429);
    expect(result.title).toBe("Crawl progress slowed");
    expect(result.subtitle).toContain("Too many status checks");
    expect(result.stopPolling).toBe(false);
  });

  it("stops polling on unexpected status codes", () => {
    const result = crawlStatusPollFailure(500);
    expect(result.title).toBe("Crawl progress unavailable");
    expect(result.subtitle).toContain("500");
    expect(result.stopPolling).toBe(true);
  });
});
