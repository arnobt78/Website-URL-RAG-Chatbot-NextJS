import { describe, expect, it } from "vitest";
import {
  CRAWL_USER_ERRORS,
  resolveCrawlFailureMessage,
} from "./crawl-errors";

describe("resolveCrawlFailureMessage", () => {
  it("returns generic message when empty", () => {
    expect(resolveCrawlFailureMessage()).toBe(CRAWL_USER_ERRORS.JOB_FAILED);
    expect(resolveCrawlFailureMessage("  ")).toBe(CRAWL_USER_ERRORS.JOB_FAILED);
  });

  it("preserves known and custom messages", () => {
    expect(resolveCrawlFailureMessage(CRAWL_USER_ERRORS.RATE_LIMITED)).toBe(
      CRAWL_USER_ERRORS.RATE_LIMITED
    );
    expect(resolveCrawlFailureMessage("Firecrawl timed out")).toBe(
      "Firecrawl timed out"
    );
  });
});
