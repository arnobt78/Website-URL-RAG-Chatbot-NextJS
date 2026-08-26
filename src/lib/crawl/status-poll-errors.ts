export type CrawlStatusPollFailure = {
  title: string;
  subtitle: string;
  stopPolling: boolean;
};

/** User-facing copy when GET /api/crawl/status fails during live progress polling. */
export function crawlStatusPollFailure(
  status: number,
  error?: string
): CrawlStatusPollFailure {
  if (status === 403) {
    return {
      title: "Crawl progress unavailable",
      subtitle:
        error?.trim() ||
        "Session required — refresh the page and try again.",
      stopPolling: true,
    };
  }

  if (status === 429) {
    return {
      title: "Crawl progress slowed",
      subtitle:
        error?.trim() ||
        "Too many status checks. Progress may update slowly.",
      stopPolling: false,
    };
  }

  return {
    title: "Crawl progress unavailable",
    subtitle:
      error?.trim() ||
      `Could not load crawl status (${status}). Refresh the page to retry.`,
    stopPolling: true,
  };
}
