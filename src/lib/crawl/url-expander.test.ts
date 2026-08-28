import { describe, expect, it } from "vitest";

import { buildCrawlPlan, expandCrawlTargets } from "@/lib/crawl/url-expander";

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

describe("buildCrawlPlan", () => {
  const origin = "https://example.com";

  it("keeps FAQ expand when near maxPages and orders it early", () => {
    const urls = Array.from({ length: 10 }, (_, i) => `${origin}/page-${i}`);
    urls.push(`${origin}/faq`);
    const plan = buildCrawlPlan(urls, origin, 10);
    expect(plan.some((t) => t.label === "FAQ expanded")).toBe(true);
    const faqIdx = plan.findIndex((t) => t.label === "FAQ expanded");
    const plainIdx = plan.findIndex(
      (t) => t.url.includes("page-0") && !t.label && !t.preferInteract
    );
    expect(faqIdx).toBeGreaterThanOrEqual(0);
    if (plainIdx >= 0) expect(faqIdx).toBeLessThan(plainIdx);
  });
});
