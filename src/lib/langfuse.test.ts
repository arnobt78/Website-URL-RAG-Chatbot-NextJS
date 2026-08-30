import { describe, expect, it } from "vitest";
import { truncateForTrace } from "./langfuse";

describe("truncateForTrace", () => {
  it("returns short strings unchanged", () => {
    expect(truncateForTrace("hello")).toBe("hello");
  });

  it("truncates long strings", () => {
    const long = "a".repeat(50);
    expect(truncateForTrace(long, 10)).toBe(`${"a".repeat(10)}…`);
  });
});
