import { describe, expect, it } from "vitest";
import { parsePositiveInt } from "./parse-positive-int";

describe("parsePositiveInt", () => {
  it("returns fallback for empty or invalid values", () => {
    expect(parsePositiveInt(undefined, 30)).toBe(30);
    expect(parsePositiveInt("", 30)).toBe(30);
    expect(parsePositiveInt("  ", 30)).toBe(30);
    expect(parsePositiveInt("abc", 30)).toBe(30);
    expect(parsePositiveInt("0", 30)).toBe(30);
    expect(parsePositiveInt("-1", 30)).toBe(30);
  });

  it("parses valid positive integers", () => {
    expect(parsePositiveInt("42", 30)).toBe(42);
    expect(parsePositiveInt(" 7 ", 30)).toBe(7);
  });

  it("respects min and max", () => {
    expect(parsePositiveInt("0", 10, { min: 0 })).toBe(0);
    expect(parsePositiveInt("999", 10, { max: 100 })).toBe(100);
  });
});
