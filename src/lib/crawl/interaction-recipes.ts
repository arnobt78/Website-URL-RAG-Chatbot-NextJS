import type { CrawlTarget } from "@/lib/crawl/crawl-target";
import { targetVariantKey } from "@/lib/crawl/crawl-target";
import {
  DIALOG_PATH_RE,
  FAQ_LIKE_PATH_RE,
  dialogHarvestActions,
  expandHarvestActions,
  isCrawlExpandHiddenEnabled,
} from "@/lib/crawl/expand-harvest";
import type { FirecrawlAction } from "@/lib/crawl/firecrawl-client";

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

function basePageUrl(url: string): string {
  return url.split("#")[0]!;
}

function actionsContainHarvest(actions: FirecrawlAction[] | undefined): boolean {
  return Boolean(
    actions?.some(
      (a) => a.type === "executeJavascript" && a.script.includes("rag-crawl-harvest")
    )
  );
}

/** Build extra scrape targets with tab-click / expand / dialog actions (deterministic). */
export function interactionTargetsForPage(
  baseUrl: string,
  options?: { expandHidden?: boolean }
): CrawlTarget[] {
  const pathname = pathnameOf(baseUrl);
  const pageUrl = basePageUrl(baseUrl);
  const expandHidden = options?.expandHidden ?? isCrawlExpandHiddenEnabled();
  const targets: CrawlTarget[] = [];

  if (TAB_PAGE_PATH_RE.test(pathname)) {
    for (const tab of RESUME_TAB_CLICKS) {
      targets.push({
        url: pageUrl,
        variantKey: targetVariantKey(baseUrl, tab.label),
        label: tab.label,
        actions: clickTabByLabel(tab.label.replace(" tab", "")),
      });
    }
  }

  const faqLike = FAQ_LIKE_PATH_RE.test(pathname);
  const dialogLike = DIALOG_PATH_RE.test(pathname) || DIALOG_PATH_RE.test(pageUrl);

  if (expandHidden || faqLike) {
    const expandLabel = faqLike ? "FAQ expanded" : "Expanded content";
    const expandVariant = faqLike ? "faq-expanded" : "expanded-content";
    targets.push({
      url: pageUrl,
      variantKey: targetVariantKey(baseUrl, expandVariant),
      label: expandLabel,
      // FAQ/dialog keep interact fallback; general expand relies on deterministic harvest
      preferInteract: faqLike || dialogLike,
      actions: expandHarvestActions(),
    });
  }

  if (dialogLike) {
    targets.push({
      url: pageUrl,
      variantKey: targetVariantKey(baseUrl, "dialogs-expanded"),
      label: "Dialogs expanded",
      preferInteract: true,
      actions: dialogHarvestActions(),
    });
  }

  return targets;
}

export function mergeTargetsWithInteractions(
  baseTargets: CrawlTarget[],
  options?: { expandHidden?: boolean }
): CrawlTarget[] {
  const expandHidden = options?.expandHidden ?? isCrawlExpandHiddenEnabled();
  const seen = new Set(baseTargets.map((t) => t.variantKey));
  const merged = [...baseTargets];
  const pagesSeen = new Set<string>();

  for (const base of baseTargets) {
    const withoutHash = basePageUrl(base.url);
    const pageKey = withoutHash.toLowerCase();
    if (pagesSeen.has(pageKey)) continue;
    pagesSeen.add(pageKey);

    const pathname = pathnameOf(withoutHash);
    const shouldExpand =
      expandHidden ||
      FAQ_LIKE_PATH_RE.test(pathname) ||
      TAB_PAGE_PATH_RE.test(pathname) ||
      DIALOG_PATH_RE.test(pathname) ||
      DIALOG_PATH_RE.test(withoutHash);

    if (!shouldExpand && !TAB_PAGE_PATH_RE.test(pathname)) continue;

    for (const extra of interactionTargetsForPage(withoutHash, { expandHidden })) {
      if (seen.has(extra.variantKey)) continue;
      seen.add(extra.variantKey);
      merged.push(extra);
    }
  }

  return merged;
}

/** Prefer interact/expand targets so interact budget is not exhausted by plain pages. */
export function prioritizeInteractionTargets(targets: CrawlTarget[]): CrawlTarget[] {
  return [...targets].sort((a, b) => {
    const score = (t: CrawlTarget) => {
      let s = 0;
      if (t.preferInteract) s += 4;
      if (t.label?.toLowerCase().includes("faq")) s += 3;
      if (t.label?.toLowerCase().includes("dialog")) s += 3;
      if (t.label?.toLowerCase().includes("expanded")) s += 2;
      if (actionsContainHarvest(t.actions)) s += 1;
      return s;
    };
    return score(b) - score(a);
  });
}
