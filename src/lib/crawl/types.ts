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

export function pathFromSourceUrl(sourceUrl: string): string {
  try {
    const pathname = new URL(sourceUrl).pathname;
    return pathname || "/";
  } catch {
    return sourceUrl;
  }
}
