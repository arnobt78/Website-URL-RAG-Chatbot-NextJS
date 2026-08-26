/** Shared crawl job types (safe for client + server). */
export type CrawlJobPhase =
  | "pending"
  | "mapping"
  | "crawling"
  | "indexing"
  | "completed"
  | "failed";

export function crawlStepTitle(phase: CrawlJobPhase | string | undefined): string {
  switch (phase) {
    case "mapping":
      return "Discovering pages…";
    case "crawling":
      return "Crawling site…";
    case "indexing":
      return "Embedding pages…";
    case "pending":
      return "Starting crawl…";
    default:
      return "Indexing site…";
  }
}

/** Progress count for crawl UI — indexing uses embedded count; else crawled (0 is valid). */
export function crawlProgressPageCount(
  phase: CrawlJobPhase | string | undefined,
  crawled: number,
  indexed: number
): number {
  return phase === "indexing" ? indexed : (crawled ?? indexed);
}

export type CrawlProgressLabel = "crawl" | "embed";

export type CrawlProgressDisplay = {
  numer: number;
  denom: number;
  label: CrawlProgressLabel;
};

/** Phase-aware X/Y for progress UI — crawl uses discovered; embed uses scraped page count. */
export function crawlProgressDisplay(
  phase: CrawlJobPhase | string | undefined,
  crawled: number,
  indexed: number,
  discovered: number
): CrawlProgressDisplay {
  if (phase === "indexing") {
    const denom = crawled > 0 ? crawled : discovered;
    return { numer: indexed, denom, label: "embed" };
  }
  return { numer: crawled, denom: discovered, label: "crawl" };
}

export function pathFromSourceUrl(sourceUrl: string): string {
  try {
    const pathname = new URL(sourceUrl).pathname;
    return pathname || "/";
  } catch {
    return sourceUrl;
  }
}
