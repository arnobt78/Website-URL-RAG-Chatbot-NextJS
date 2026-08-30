/**
 * User-facing crawl / recrawl copy — keep short and actionable for ingestError + phaseDetail.
 */
export const CRAWL_USER_ERRORS = {
  RATE_LIMITED:
    "Too many site crawl requests. Please wait an hour and try again.",
  INDEXING_RATE_LIMITED:
    "Too many indexing requests. Please wait a minute and try again.",
  STATUS_RATE_LIMITED:
    "Too many crawl status requests. Please wait and try again.",
  MISSING_FIRECRAWL:
    "Site crawl is not configured. Add FIRECRAWL_API_KEY to enable whole-site indexing.",
  MISSING_QSTASH:
    "Background crawl is not configured. Add QSTASH_TOKEN to enable whole-site indexing.",
  WORKFLOW_START_FAILED:
    "Could not start site crawl workflow. Check QStash, APP_BASE_URL, and try again.",
  NO_PAGES_INDEXED:
    "No pages could be indexed from this site. Try re-crawl or a different URL.",
  JOB_FAILED:
    "Site crawl failed. Try re-crawl, or check Firecrawl credits and whether the site is reachable.",
} as const;

export type CrawlUserErrorKey = keyof typeof CRAWL_USER_ERRORS;

/** Prefer a known user message; otherwise keep a trimmed job error or the generic failure copy. */
export function resolveCrawlFailureMessage(error?: string | null): string {
  const trimmed = error?.trim();
  if (!trimmed) return CRAWL_USER_ERRORS.JOB_FAILED;
  for (const message of Object.values(CRAWL_USER_ERRORS)) {
    if (trimmed === message || trimmed.startsWith(message.slice(0, 40))) {
      return trimmed;
    }
  }
  return trimmed;
}

export function logCrawlEvent(
  event: "crawl_start" | "crawl_fail" | "recrawl_fail",
  fields: Record<string, string | number | boolean | undefined>
): void {
  console.info(
    JSON.stringify({
      scope: "crawl",
      event,
      ...fields,
      at: new Date().toISOString(),
    })
  );
}
