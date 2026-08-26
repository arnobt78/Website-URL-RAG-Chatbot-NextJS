import { describe, expect, it } from "vitest";

import { expandCrawlTargets } from "@/lib/crawl/url-expander";

describe("expandCrawlTargets", () => {
  const origin = "https://www.arnobmahmud.com";

  it("adds resume tab hash variants", () => {
    const targets = expandCrawlTargets(
      [`${origin}/resume`, `${origin}/about`],
      origin,
      50
    );
    const keys = targets.map((t) => t.variantKey);
    expect(keys.some((k) => k.includes("experience"))).toBe(true);
    expect(keys.some((k) => k.includes("education"))).toBe(true);
    expect(keys.some((k) => k.includes("skills"))).toBe(true);
  });

  it("respects maxTargets cap", () => {
    const targets = expandCrawlTargets([`${origin}/resume`], origin, 3);
    expect(targets.length).toBeLessThanOrEqual(3);
  });

  it("preserves hash URLs from map", () => {
    const targets = expandCrawlTargets(
      [`${origin}/resume#experience`],
      origin,
      50
    );
    expect(targets.some((t) => t.url.includes("#experience"))).toBe(true);
  });
});
