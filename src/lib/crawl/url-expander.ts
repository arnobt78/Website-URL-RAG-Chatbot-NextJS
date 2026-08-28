import type { CrawlTarget } from "@/lib/crawl/crawl-target";
import { dedupeTargets, targetVariantKey } from "@/lib/crawl/crawl-target";
import {
  mergeTargetsWithInteractions,
  prioritizeInteractionTargets,
} from "@/lib/crawl/interaction-recipes";

const TAB_PAGE_PATH_RE = /^\/(resume|cv|profile)(\/|$)/i;

const RESUME_TAB_HASHES: { hash: string; label: string }[] = [
  { hash: "#experience", label: "Experience tab" },
  { hash: "#education", label: "Education tab" },
  { hash: "#skills", label: "Skills tab" },
];

function originFromSite(siteOriginUrl: string): URL | null {
  try {
    return new URL(siteOriginUrl);
  } catch {
    return null;
  }
}

function withHash(baseUrl: string, hash: string): string {
  try {
    const parsed = new URL(baseUrl);
    parsed.hash = hash.startsWith("#") ? hash : `#${hash}`;
    return parsed.href;
  } catch {
    return baseUrl;
  }
}

function isTabPagePath(pathname: string): boolean {
  return TAB_PAGE_PATH_RE.test(pathname);
}

/** Add hash-route variants for portfolio resume/cv/profile pages. */
function expandTabPageTargets(url: string): CrawlTarget[] {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return [];
  }
  if (!isTabPagePath(pathname)) return [];

  const targets: CrawlTarget[] = [];
  for (const { hash, label } of RESUME_TAB_HASHES) {
    const hashUrl = withHash(url, hash);
    targets.push({
      url: hashUrl,
      variantKey: targetVariantKey(hashUrl, label),
      label,
    });
  }
  return targets;
}

/**
 * Expand prioritized URLs with hash variants and tab-page recipes.
 * Expanded targets count toward maxTargets budget.
 */
export function expandCrawlTargets(
  urls: string[],
  siteOriginUrl: string,
  maxTargets: number
): CrawlTarget[] {
  const origin = originFromSite(siteOriginUrl);
  if (!origin) return [];

  const expanded: CrawlTarget[] = [];

  for (const raw of urls) {
    let parsed: URL;
    try {
      parsed = new URL(raw, origin.href);
    } catch {
      continue;
    }
    if (parsed.hostname.toLowerCase() !== origin.hostname.toLowerCase()) continue;

    const baseUrl =
      parsed.href.endsWith("/") && parsed.pathname !== "/"
        ? parsed.href.slice(0, -1)
        : parsed.href;

    expanded.push({
      url: baseUrl,
      variantKey: targetVariantKey(baseUrl),
    });

    if (parsed.hash) {
      expanded.push({
        url: baseUrl,
        variantKey: targetVariantKey(baseUrl, parsed.hash),
        label: parsed.hash.replace(/^#/, ""),
      });
    }

    const withoutHash = new URL(baseUrl);
    withoutHash.hash = "";
    expanded.push(...expandTabPageTargets(withoutHash.href));
  }

  const deduped = dedupeTargets(expanded);
  return deduped.slice(0, Math.max(1, maxTargets));
}

/** Merge prioritized URLs, hash expansion, and interaction targets into final scrape plan.
 * Cap allows expand/dialog variants beyond base page count (up to 2× maxPages).
 * preferInteract / expand targets are ordered first so workflow batches scrape them early.
 */
export function buildCrawlPlan(
  selectedUrls: string[],
  siteOriginUrl: string,
  maxPages: number
): CrawlTarget[] {
  const base: CrawlTarget[] = selectedUrls.map((url) => ({
    url,
    variantKey: targetVariantKey(url),
  }));
  const withInteractions = mergeTargetsWithInteractions(base);
  const hashExpanded = expandCrawlTargets(selectedUrls, siteOriginUrl, maxPages * 2);
  const byKey = new Map<string, CrawlTarget>();
  for (const t of [...withInteractions, ...hashExpanded]) {
    if (!byKey.has(t.variantKey)) byKey.set(t.variantKey, t);
  }
  const ordered = prioritizeInteractionTargets([...byKey.values()]);
  const cap = Math.max(1, maxPages * 2);
  return ordered.slice(0, cap);
}

/** Extract same-origin hash links from a page link list for expansion. */
export function hashLinksFromPage(links: string[], pageUrl: string): string[] {
  let pageOrigin: URL;
  try {
    pageOrigin = new URL(pageUrl);
  } catch {
    return [];
  }
  const basePath = pageOrigin.pathname;
  const out: string[] = [];
  for (const link of links) {
    try {
      const parsed = new URL(link, pageUrl);
      if (parsed.hostname.toLowerCase() !== pageOrigin.hostname.toLowerCase()) continue;
      if (!parsed.hash) continue;
      if (parsed.pathname === basePath || parsed.pathname === basePath.replace(/\/$/, "")) {
        out.push(parsed.href);
      }
    } catch {
      /* skip invalid */
    }
  }
  return out;
}
