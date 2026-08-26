import { describe, expect, it } from "vitest";

import { interactionTargetsForPage } from "@/lib/crawl/interaction-recipes";

describe("interactionTargetsForPage", () => {
  it("returns tab click targets for /resume", () => {
    const targets = interactionTargetsForPage("https://example.com/resume");
    expect(targets.length).toBeGreaterThanOrEqual(3);
    expect(targets.some((t) => t.label === "Education tab")).toBe(true);
    expect(targets.find((t) => t.label === "Education tab")?.actions?.length).toBeGreaterThan(0);
  });

  it("returns FAQ target for /faq", () => {
    const targets = interactionTargetsForPage("https://example.com/faq");
    expect(targets.some((t) => t.label === "FAQ expanded")).toBe(true);
    expect(targets[0]?.preferInteract).toBe(true);
  });
});
