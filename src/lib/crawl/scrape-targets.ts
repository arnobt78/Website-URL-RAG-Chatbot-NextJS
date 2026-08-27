import "server-only";

import {
  getCrawlInteractEnabled,
  getCrawlInteractMaxPages,
  getCrawlMaxActionsPerPage,
} from "@/lib/crawl/config";
import type { CrawlTarget } from "@/lib/crawl/crawl-target";
import { updateCrawlJob } from "@/lib/crawl/crawl-job-store";
import {
  firecrawlInteract,
  firecrawlScrapeForInteract,
  firecrawlScrapeUrl,
  MIN_SCRAPE_CHARS,
  type CrawledPage,
  type FirecrawlAction,
} from "@/lib/crawl/firecrawl-client";
import { pathFromSourceUrl } from "@/lib/crawl/types";

function capActions(actions: FirecrawlAction[] | undefined, max: number): FirecrawlAction[] {
  if (!actions?.length) return [];
  return actions.slice(0, max);
}

async function updateScrapeProgress(
  siteRootKey: string,
  args: { crawled: number; currentPath: string; phaseDetail: string },
  runId?: string
): Promise<void> {
  await updateCrawlJob(
    siteRootKey,
    {
      status: "crawling",
      crawled: args.crawled,
      currentPath: args.currentPath,
      phaseDetail: args.phaseDetail,
    },
    { expectedRunId: runId }
  );
}

async function scrapeTarget(
  target: CrawlTarget,
  interactBudget: { remaining: number }
): Promise<CrawledPage | null> {
  const maxActions = getCrawlMaxActionsPerPage();
  const actions = capActions(target.actions, maxActions);

  try {
    const { page } = await firecrawlScrapeUrl(target.url, {
      actions: actions.length ? actions : undefined,
      waitFor: 2000,
      formats: ["markdown", "links"],
      maxAge: 0,
    });

    let result = page;
    if (result && target.label) {
      result = {
        ...result,
        sourceUrl: `${target.url.split("#")[0]} [${target.label}]`,
        label: target.label,
        variantKey: target.variantKey,
      };
    } else if (result) {
      result = { ...result, variantKey: target.variantKey };
    }

    const needsInteract =
      getCrawlInteractEnabled() &&
      interactBudget.remaining > 0 &&
      (target.preferInteract || !result || result.markdown.length < MIN_SCRAPE_CHARS);

    if (needsInteract) {
      try {
        const session = await firecrawlScrapeForInteract(target.url.split("#")[0]!);
        const interacted = await firecrawlInteract(session.scrapeId);
        interactBudget.remaining -= 1;
        if (interacted && interacted.markdown.length >= MIN_SCRAPE_CHARS) {
          return {
            ...interacted,
            sourceUrl: `${target.url.split("#")[0]} [interact${target.label ? `: ${target.label}` : ""}]`,
            label: target.label ?? "interact",
            variantKey: `${target.variantKey}:interact`,
            title: result?.title ?? session.page?.title,
          };
        }
        if (!result && session.page) {
          return { ...session.page, variantKey: target.variantKey };
        }
      } catch {
        /* fall back to deterministic scrape result */
      }
    }

    return result;
  } catch {
    return null;
  }
}

export type ScrapeTargetsResult = {
  pages: CrawledPage[];
  failed: number;
};

/** Scrape all targets sequentially with live Redis progress updates. */
export async function scrapeCrawlTargets(
  targets: CrawlTarget[],
  siteRootKey: string,
  crawledOffset = 0,
  runId?: string
): Promise<ScrapeTargetsResult> {
  const pages: CrawledPage[] = [];
  const seenVariants = new Set<string>();
  let failed = 0;
  const interactBudget = { remaining: getCrawlInteractMaxPages() };

  for (const target of targets) {
    const pathLabel = pathFromSourceUrl(target.url);
    const detail = target.label
      ? `Scraping ${pathLabel} (${target.label})…`
      : `Scraping ${pathLabel}…`;

    await updateScrapeProgress(siteRootKey, {
      crawled: crawledOffset + pages.length,
      currentPath: pathLabel,
      phaseDetail: detail,
    }, runId);

    const page = await scrapeTarget(target, interactBudget);
    if (!page || page.markdown.length < MIN_SCRAPE_CHARS) {
      failed += 1;
      continue;
    }

    const variant = page.variantKey ?? target.variantKey;
    if (seenVariants.has(variant)) continue;
    seenVariants.add(variant);

    pages.push(page);
    await updateScrapeProgress(siteRootKey, {
      crawled: crawledOffset + pages.length,
      currentPath: pathLabel,
      phaseDetail: detail,
    }, runId);
  }

  return { pages, failed };
}
