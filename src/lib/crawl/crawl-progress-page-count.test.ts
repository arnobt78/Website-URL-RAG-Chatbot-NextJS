import { describe, expect, it } from "vitest";
import { crawlProgressPageCount } from "./types";

describe("crawlProgressPageCount", () => {
  it("returns crawled when 0 during crawling (no fallback to indexed)", () => {
    expect(crawlProgressPageCount("crawling", 0, 5)).toBe(0);
  });

  it("returns indexed during indexing phase", () => {
    expect(crawlProgressPageCount("indexing", 10, 7)).toBe(7);
  });
});
