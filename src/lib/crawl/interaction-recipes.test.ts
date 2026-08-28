import { describe, expect, it } from "vitest";

import {
  interactionTargetsForPage,
  mergeTargetsWithInteractions,
  prioritizeInteractionTargets,
} from "@/lib/crawl/interaction-recipes";

describe("interactionTargetsForPage", () => {
  it("returns tab click targets for /resume", () => {
    const targets = interactionTargetsForPage("https://example.com/resume", {
      expandHidden: false,
    });
    expect(targets.length).toBeGreaterThanOrEqual(3);
    expect(targets.some((t) => t.label === "Education tab")).toBe(true);
    expect(targets.find((t) => t.label === "Education tab")?.actions?.length).toBeGreaterThan(0);
  });

  it("returns FAQ harvest target with rag-crawl-harvest script", () => {
    const targets = interactionTargetsForPage("https://example.com/faq", {
      expandHidden: false,
    });
    const faq = targets.find((t) => t.label === "FAQ expanded");
    expect(faq).toBeDefined();
    expect(faq?.preferInteract).toBe(true);
    const js = faq?.actions?.find((a) => a.type === "executeJavascript");
    expect(js && js.type === "executeJavascript" && js.script).toContain("rag-crawl-harvest");
    expect(js && js.type === "executeJavascript" && js.script).toContain("aria-expanded");
  });

  it("returns Expanded content for /help when expand enabled", () => {
    const targets = interactionTargetsForPage("https://example.com/help", {
      expandHidden: true,
    });
    expect(targets.some((t) => t.label === "FAQ expanded")).toBe(true);
  });

  it("returns expand target for a normal page when expand enabled without preferInteract", () => {
    const targets = interactionTargetsForPage("https://example.com/about", {
      expandHidden: true,
    });
    const expanded = targets.find((t) => t.label === "Expanded content");
    expect(expanded).toBeDefined();
    expect(expanded?.preferInteract).toBe(false);
  });

  it("returns Dialogs expanded for dialog-modal paths", () => {
    const url = "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/";
    const targets = interactionTargetsForPage(url, { expandHidden: true });
    const dialog = targets.find((t) => t.label === "Dialogs expanded");
    expect(dialog).toBeDefined();
    expect(dialog?.preferInteract).toBe(true);
    const js = dialog?.actions?.find((a) => a.type === "executeJavascript");
    expect(js && js.type === "executeJavascript" && js.script).toContain("rag-crawl-harvest");
    expect(js && js.type === "executeJavascript" && js.script).toContain("async function");
  });
});

describe("mergeTargetsWithInteractions", () => {
  it("includes expand variants for base pages when expand enabled", () => {
    const merged = mergeTargetsWithInteractions(
      [
        { url: "https://example.com/faq", variantKey: "faq" },
        { url: "https://example.com/about", variantKey: "about" },
      ],
      { expandHidden: true }
    );
    expect(merged.some((t) => t.label === "FAQ expanded")).toBe(true);
    expect(merged.some((t) => t.label === "Expanded content")).toBe(true);
  });

  it("still adds FAQ expand when expandHidden is false", () => {
    const merged = mergeTargetsWithInteractions(
      [{ url: "https://example.com/faq", variantKey: "faq" }],
      { expandHidden: false }
    );
    expect(merged.some((t) => t.label === "FAQ expanded")).toBe(true);
  });
});

describe("prioritizeInteractionTargets", () => {
  it("orders preferInteract / FAQ ahead of plain URLs", () => {
    const ordered = prioritizeInteractionTargets([
      { url: "https://example.com/a", variantKey: "a" },
      {
        url: "https://example.com/faq",
        variantKey: "faq-x",
        label: "FAQ expanded",
        preferInteract: true,
      },
      { url: "https://example.com/b", variantKey: "b" },
    ]);
    expect(ordered[0]?.label).toBe("FAQ expanded");
  });
});
