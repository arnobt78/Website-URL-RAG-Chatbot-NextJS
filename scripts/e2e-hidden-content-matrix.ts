/**
 * Live multi-scenario crawl harvest matrix (verify-deep).
 * Run: npx tsx scripts/e2e-hidden-content-matrix.ts
 * Does not print secrets.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

for (const line of readFileSync(resolve(".env"), "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const k = m[1]!.trim();
  let v = m[2]!.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!(k in process.env)) process.env[k] = v;
}

import {
  dialogHarvestActions,
  expandHarvestActions,
} from "../src/lib/crawl/expand-harvest";
import {
  interactionTargetsForPage,
  mergeTargetsWithInteractions,
} from "../src/lib/crawl/interaction-recipes";
import type { FirecrawlAction } from "../src/lib/crawl/firecrawl-client";
import { buildCrawlPlan } from "../src/lib/crawl/url-expander";

type Scenario = {
  id: string;
  url: string;
  mode: "expand" | "dialog" | "tabs" | "tabs-generic" | "plan";
  expectAny?: RegExp[];
  minDelta?: number;
  /** Words that must appear after expand (not only in collapsed chrome). */
  mustGain?: string[];
  /** For tabs-generic: substrings that appear only after activating non-default tabs. */
  mustGainAfterTabs?: string[];
};

const key = process.env.FIRECRAWL_API_KEY?.trim();
if (!key) {
  console.error("FAIL: FIRECRAWL_API_KEY missing");
  process.exit(2);
}

async function scrape(
  url: string,
  actions: unknown[],
  onlyMainContent: boolean
): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent,
      maxAge: 0,
      waitFor: 2500,
      actions,
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const body = (await res.json()) as {
    success?: boolean;
    error?: string;
    data?: { markdown?: string };
  };
  if (!body.success) throw new Error(body.error || `HTTP ${res.status}`);
  return String(body.data?.markdown ?? "");
}

/** Click every role=tab then wait — for APG-style tablists outside resume recipes. */
function clickAllTabsActions(): FirecrawlAction[] {
  return [
    { type: "wait", milliseconds: 800 },
    {
      type: "executeJavascript",
      script: `(async function(){
        function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
        var tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        var parts = [];
        for (var i = 0; i < tabs.length; i++) {
          try { tabs[i].click(); } catch (e) {}
          await sleep(400);
          var panel = document.querySelector('[role="tabpanel"]:not([hidden])')
            || document.querySelector('[role="tabpanel"][aria-hidden="false"]')
            || document.querySelector('[role="tabpanel"]');
          if (panel) parts.push((panel.innerText || panel.textContent || "").replace(/\\s+/g, " ").trim());
        }
        var node = document.getElementById("rag-crawl-harvest");
        if (!node) {
          node = document.createElement("div");
          node.id = "rag-crawl-harvest";
          node.setAttribute("data-rag-expanded", "true");
          node.style.cssText = "display:block;visibility:visible;opacity:1;padding:1rem;white-space:pre-wrap;";
          (document.querySelector("main, [role='main'], article") || document.body).appendChild(node);
        }
        node.textContent = parts.filter(Boolean).join("\\n\\n");
        return parts.length;
      })()`,
    },
    { type: "wait", milliseconds: 2000 },
  ];
}

const scenarios: Scenario[] = [
  {
    id: "faq-radix-accordion",
    url: "https://www.arnobmahmud.com/faq",
    mode: "expand",
    minDelta: 1.5,
    mustGain: ["Bangladesh", "work permit", "Next.js", "Slack"],
  },
  {
    id: "dialog-apg-modal",
    url: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/",
    mode: "dialog",
    expectAny: [/Add Delivery Address/i, /Street/i, /Zip/i],
  },
  {
    id: "alert-dialog-apg",
    url: "https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/examples/alertdialog/",
    mode: "dialog",
    expectAny: [/alert/i, /discard|confirm|delete|yes|no|cancel/i],
  },
  {
    id: "details-summary-mdn",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details",
    mode: "expand",
    expectAny: [/The <details> HTML element/i, /summary/i],
    mustGain: ["disclosure widget"],
  },
  {
    id: "disclosure-apg-faq",
    url: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-faq/",
    mode: "expand",
    mustGain: ["parking meter", "999-999-9999", "Parking Office"],
  },
  {
    id: "collapse-bootstrap",
    url: "https://getbootstrap.com/docs/5.3/components/collapse/",
    mode: "expand",
    expectAny: [/Some placeholder content/i, /collapse/i],
    minDelta: 1.05,
  },
  {
    id: "read-more-w3schools",
    url: "https://www.w3schools.com/howto/howto_js_read_more.asp",
    mode: "expand",
    mustGain: ["artificial intelligence", "Lorem Ipsum"],
  },
  {
    id: "tabs-apg-manual",
    url: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/",
    mode: "expand",
    mustGain: ["Maria Ahlefeldt", "Carl Andersen", "Ida da Fonseca"],
  },
  {
    id: "tabs-hash-resume",
    url: "https://www.arnobmahmud.com/resume#experience",
    mode: "tabs",
  },
  {
    id: "tabs-query-resume",
    url: "https://www.arnobmahmud.com/resume?tab=skills",
    mode: "tabs",
  },
  {
    id: "help-path-expand-recipe",
    url: "https://example.com/help",
    mode: "plan",
  },
];

type Row = {
  id: string;
  pass: boolean;
  detail: string;
};

async function main(): Promise<void> {
  const rows: Row[] = [];

  function recipeCheck(url: string, id: string): Row {
    const targets = interactionTargetsForPage(url, { expandHidden: true });
    const labels = targets.map((t) => t.label).filter(Boolean);
    if (id.startsWith("tabs")) {
      const hasTabs = labels.some((l) => /Experience|Education|Skills/.test(l || ""));
      const hasExpand = labels.some((l) => /Expanded|FAQ/.test(l || ""));
      return {
        id,
        pass: hasTabs && hasExpand,
        detail: `labels=${labels.join(",")}`,
      };
    }
    if (id.includes("dialog") || id.includes("alert")) {
      const hasDialog = labels.includes("Dialogs expanded");
      return { id, pass: hasDialog, detail: `labels=${labels.join(",")}` };
    }
    if (id.includes("help") || id.includes("faq")) {
      const hasFaq = labels.some((l) => /FAQ|Expanded/.test(l || ""));
      return { id, pass: hasFaq, detail: `labels=${labels.join(",")}` };
    }
    return { id, pass: targets.length > 0, detail: `n=${targets.length}` };
  }

  for (const s of scenarios) {
    process.stdout.write(`\n== ${s.id} ==\n`);
    try {
      if (s.mode === "plan") {
        rows.push(recipeCheck(s.url, s.id));
        console.log(rows[rows.length - 1]);
        continue;
      }

      if (s.mode === "tabs") {
        rows.push(recipeCheck(s.url, s.id));
        const targets = interactionTargetsForPage(s.url, { expandHidden: true });
        const tab = targets.find((t) => t.label === "Experience tab") || targets[0];
        if (tab?.actions?.length) {
          const md = await scrape(s.url.split("?")[0]!.split("#")[0]!, tab.actions, false);
          const ok = md.length > 200;
          rows.push({
            id: `${s.id}-live`,
            pass: ok,
            detail: `len=${md.length}`,
          });
          console.log(rows[rows.length - 1]);
        }
        continue;
      }

      if (s.mode === "tabs-generic") {
        const baseline = await scrape(s.url, [], true);
        const harvested = await scrape(s.url, clickAllTabsActions(), false);
        const needed = s.mustGainAfterTabs || [];
        const gains = needed.filter((w) => harvested.includes(w));
        const pass = gains.length >= Math.min(2, needed.length);
        const detail = `base=${baseline.length} harvest=${harvested.length} gains=${gains.join("|")}`;
        rows.push({ id: s.id, pass, detail });
        console.log(detail, pass ? "PASS" : "FAIL");
        continue;
      }

      const baseline = await scrape(s.url, [], true);
      const actions =
        s.mode === "dialog" ? dialogHarvestActions() : expandHarvestActions();
      const harvested = await scrape(s.url, actions, false);

      const gains = (s.mustGain || []).filter((w) => harvested.includes(w));
      const expectOk =
        !s.expectAny || s.expectAny.some((re) => re.test(harvested));
      const deltaOk =
        s.minDelta == null || harvested.length >= baseline.length * s.minDelta;
      const mustOk = !s.mustGain || gains.length >= Math.min(2, s.mustGain.length);

      const pass = expectOk && deltaOk && mustOk;
      const detail = `base=${baseline.length} harvest=${harvested.length} gains=${gains.join("|")} expect=${expectOk}`;
      rows.push({ id: s.id, pass, detail });
      console.log(detail, pass ? "PASS" : "FAIL");
    } catch (e) {
      rows.push({ id: s.id, pass: false, detail: String(e) });
      console.log("ERROR", e);
    }
  }

  const plan = buildCrawlPlan(
    [
      "https://example.com/a",
      "https://example.com/b",
      "https://example.com/faq",
    ],
    "https://example.com",
    3
  );
  const planHasFaq = plan.some((t) => t.label === "FAQ expanded");
  rows.push({
    id: "plan-faq-priority",
    pass: planHasFaq,
    detail: `planLabels=${plan.map((t) => t.label || t.variantKey).join(",")}`,
  });

  const merged = mergeTargetsWithInteractions(
    [{ url: "https://example.com/about", variantKey: "about" }],
    { expandHidden: true }
  );
  rows.push({
    id: "merge-general-expand",
    pass: merged.some((t) => t.label === "Expanded content"),
    detail: merged.map((t) => t.label).join(","),
  });

  console.log("\n===== MATRIX =====");
  for (const r of rows) {
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.id}  ${r.detail}`);
  }
  const failed = rows.filter((r) => !r.pass);
  console.log(`\nSUMMARY ${rows.length - failed.length}/${rows.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
