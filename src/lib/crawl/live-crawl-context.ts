import { crawlProgressPageCount, type CrawlJobPhase } from "@/lib/crawl/types";
import type { ChatPageContext } from "@/types/chat";

export type LiveCrawlPoll = {
  status: CrawlJobPhase | "idle";
  crawled: number;
  discovered: number;
  indexed: number;
  recentPages: string[];
  indexedPages: string[];
  currentPath?: string;
  phaseDetail?: string;
};

export type MergeLiveCrawlOptions = {
  /** When true (re-crawl), live zeros and empty lists win over stale SSR values. */
  preferLiveCounts?: boolean;
};

function mergeCount(
  liveValue: number,
  baseValue: number | undefined,
  preferLive: boolean
): number | undefined {
  if (preferLive) return liveValue;
  return liveValue ?? baseValue;
}

function mergeStringList(
  liveList: string[],
  baseList: string[] | undefined,
  preferLive: boolean
): string[] | undefined {
  if (preferLive) return liveList;
  return liveList.length > 0 ? liveList : baseList;
}

/** Merge polled crawl job fields into SSR page context without falsy-0 fallbacks. */
export function mergeLiveCrawlContext(
  base: ChatPageContext,
  live: LiveCrawlPoll,
  options?: MergeLiveCrawlOptions
): ChatPageContext {
  const preferLive = options?.preferLiveCounts ?? false;

  const crawlStatus =
    live.status === "completed"
      ? "completed"
      : live.status === "failed"
        ? "failed"
        : live.status === "idle"
          ? base.crawlStatus
          : "running";

  const progressCount = crawlProgressPageCount(live.status, live.crawled, live.indexed);

  return {
    ...base,
    crawlStatus,
    crawlJobPhase: live.status === "idle" ? base.crawlJobPhase : live.status,
    crawledPageCount: mergeCount(progressCount, base.crawledPageCount, preferLive),
    discoveredPageCount: mergeCount(live.discovered, base.discoveredPageCount, preferLive),
    recentPages: mergeStringList(live.recentPages, base.recentPages, preferLive),
    indexedPages: mergeStringList(live.indexedPages, base.indexedPages, preferLive),
    currentPath: live.currentPath ?? base.currentPath,
    phaseDetail: live.phaseDetail ?? base.phaseDetail,
  };
}
