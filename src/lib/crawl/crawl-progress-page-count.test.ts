import { describe, expect, it } from "vitest";
import {
  crawlProgressDisplay,
  crawlProgressPageCount,
} from "./types";

describe("crawlProgressPageCount", () => {
  it("returns crawled when 0 during crawling (no fallback to indexed)", () => {
    expect(crawlProgressPageCount("crawling", 0, 5)).toBe(0);
  });

  it("returns indexed during indexing phase", () => {
    expect(crawlProgressPageCount("indexing", 10, 7)).toBe(7);
  });
});

describe("crawlProgressDisplay", () => {
  it("uses discovered as denominator during crawling", () => {
    expect(crawlProgressDisplay("crawling", 3, 0, 17)).toEqual({
      numer: 3,
      denom: 17,
      label: "crawl",
    });
  });

  it("uses crawled as denominator during indexing", () => {
    expect(crawlProgressDisplay("indexing", 10, 3, 17)).toEqual({
      numer: 3,
      denom: 10,
      label: "embed",
    });
  });
});
