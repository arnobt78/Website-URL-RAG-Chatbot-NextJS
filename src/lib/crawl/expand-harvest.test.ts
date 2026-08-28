import { describe, expect, it } from "vitest";

import {
  DIALOG_HARVEST_SCRIPT,
  DIALOG_PATH_RE,
  EXPAND_HARVEST_SCRIPT,
  FAQ_LIKE_PATH_RE,
  HARVEST_SETTLE_MS,
  MAX_DIALOG_OPENERS,
  RAG_HARVEST_NODE_ID,
  dialogHarvestActions,
  expandHarvestActions,
  isCrawlExpandHiddenEnabled,
} from "@/lib/crawl/expand-harvest";

describe("expand-harvest", () => {
  it("exports non-empty harvest scripts with exclusions and harvest node", () => {
    expect(EXPAND_HARVEST_SCRIPT.length).toBeGreaterThan(100);
    expect(EXPAND_HARVEST_SCRIPT).toContain(RAG_HARVEST_NODE_ID);
    expect(EXPAND_HARVEST_SCRIPT).toContain("aria-expanded");
    expect(EXPAND_HARVEST_SCRIPT).toContain("cookie");
    expect(EXPAND_HARVEST_SCRIPT).toContain("main, [role='main'], article");
    expect(EXPAND_HARVEST_SCRIPT).not.toContain('querySelectorAll(\'[data-state="closed"]\'');
    expect(EXPAND_HARVEST_SCRIPT).toContain("async function");
    expect(EXPAND_HARVEST_SCRIPT).toContain("setTimeout");
    expect(EXPAND_HARVEST_SCRIPT).toContain(String(HARVEST_SETTLE_MS));
    expect(EXPAND_HARVEST_SCRIPT).toContain('[role="tab"]');
    expect(EXPAND_HARVEST_SCRIPT).toContain("read more");
    expect(EXPAND_HARVEST_SCRIPT).toContain('closest("form")');

    expect(DIALOG_HARVEST_SCRIPT.length).toBeGreaterThan(100);
    expect(DIALOG_HARVEST_SCRIPT).toContain(RAG_HARVEST_NODE_ID);
    expect(DIALOG_HARVEST_SCRIPT).toContain("async function");
    expect(DIALOG_HARVEST_SCRIPT).toContain('aria-haspopup="dialog"');
    expect(DIALOG_HARVEST_SCRIPT).toContain(String(MAX_DIALOG_OPENERS));
  });

  it("builds wait + executeJavascript + wait action chains", () => {
    const expand = expandHarvestActions();
    expect(expand).toHaveLength(3);
    expect(expand[0]?.type).toBe("wait");
    expect(expand[1]).toMatchObject({ type: "executeJavascript" });
    expect(expand[2]?.type).toBe("wait");
    if (expand[1]?.type === "executeJavascript") {
      expect(expand[1].script).toContain(RAG_HARVEST_NODE_ID);
    }

    const dialog = dialogHarvestActions();
    expect(dialog[1]?.type).toBe("executeJavascript");
  });

  it("matches FAQ-like and dialog path heuristics", () => {
    expect(FAQ_LIKE_PATH_RE.test("/faq")).toBe(true);
    expect(FAQ_LIKE_PATH_RE.test("/help/contact")).toBe(true);
    expect(FAQ_LIKE_PATH_RE.test("/about")).toBe(false);
    expect(DIALOG_PATH_RE.test("/dialog-modal/examples/dialog.html")).toBe(true);
  });

  it("defaults expand-hidden to enabled", () => {
    const prev = process.env.CRAWL_EXPAND_HIDDEN;
    delete process.env.CRAWL_EXPAND_HIDDEN;
    expect(isCrawlExpandHiddenEnabled()).toBe(true);
    process.env.CRAWL_EXPAND_HIDDEN = "false";
    expect(isCrawlExpandHiddenEnabled()).toBe(false);
    if (prev === undefined) delete process.env.CRAWL_EXPAND_HIDDEN;
    else process.env.CRAWL_EXPAND_HIDDEN = prev;
  });
});
