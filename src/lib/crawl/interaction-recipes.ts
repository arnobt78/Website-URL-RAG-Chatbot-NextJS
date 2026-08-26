import type { CrawlTarget } from "@/lib/crawl/crawl-target";
import { targetVariantKey } from "@/lib/crawl/crawl-target";
import type { FirecrawlAction } from "@/lib/crawl/firecrawl-client";

const FAQ_PATH_RE = /^\/faq(\/|$)/i;
const TAB_PAGE_PATH_RE = /^\/(resume|cv|profile)(\/|$)/i;

const RESUME_TAB_CLICKS: { label: string }[] = [
  { label: "Experience tab" },
  { label: "Education tab" },
  { label: "Skills tab" },
];

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function waitMs(ms: number): FirecrawlAction {
  return { type: "wait", milliseconds: ms };
}

function clickTabByLabel(label: string): FirecrawlAction[] {
  const escaped = JSON.stringify(label);
  return [
    waitMs(800),
    {
      type: "executeJavascript",
      script: `(function(){
        const label = ${escaped};
        const nodes = Array.from(document.querySelectorAll('button,[role="tab"]'));
        const match = nodes.find(function(el){ return (el.textContent||'').trim().indexOf(label) >= 0; });
        if (match) match.click();
        return !!match;
      })()`,
    },
    waitMs(1500),
  ];
}

/** Build extra scrape targets with tab-click actions (deterministic, no AI). */
export function interactionTargetsForPage(baseUrl: string): CrawlTarget[] {
  const pathname = pathnameOf(baseUrl);
  const targets: CrawlTarget[] = [];

  if (TAB_PAGE_PATH_RE.test(pathname)) {
    for (const tab of RESUME_TAB_CLICKS) {
      targets.push({
        url: baseUrl.split("#")[0]!,
        variantKey: targetVariantKey(baseUrl, tab.label),
        label: tab.label,
        actions: clickTabByLabel(tab.label.replace(" tab", "")),
      });
    }
  }

  if (FAQ_PATH_RE.test(pathname)) {
    targets.push({
      url: baseUrl.split("#")[0]!,
      variantKey: targetVariantKey(baseUrl, "faq-expanded"),
      label: "FAQ expanded",
      preferInteract: true,
      actions: [
        waitMs(1000),
        {
          type: "executeJavascript",
          script: `(function(){
            document.querySelectorAll('details:not([open]) summary').forEach(function(s){ s.click(); });
            document.querySelectorAll('[data-state="closed"]').forEach(function(el){ el.click(); });
            return true;
          })()`,
        },
        waitMs(1500),
      ],
    });
  }

  return targets;
}

export function mergeTargetsWithInteractions(baseTargets: CrawlTarget[]): CrawlTarget[] {
  const seen = new Set(baseTargets.map((t) => t.variantKey));
  const merged = [...baseTargets];

  for (const base of baseTargets) {
    const pathname = pathnameOf(base.url);
    if (!TAB_PAGE_PATH_RE.test(pathname) && !FAQ_PATH_RE.test(pathname)) continue;

    const withoutHash = base.url.split("#")[0]!;
    for (const extra of interactionTargetsForPage(withoutHash)) {
      if (seen.has(extra.variantKey)) continue;
      seen.add(extra.variantKey);
      merged.push(extra);
    }
  }

  return merged;
}
