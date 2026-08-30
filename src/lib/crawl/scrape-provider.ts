import "server-only";

import { getCrawlProvider, isCrawl4aiConfigured } from "@/lib/crawl/config";
import {
  crawl4aiMapSite,
  crawl4aiScrapeUrl,
} from "@/lib/crawl/crawl4ai-client";
import {
  firecrawlMapSite,
  firecrawlScrapeUrl,
  type CrawledPage,
  type ScrapeUrlOptions,
} from "@/lib/crawl/firecrawl-client";

/** Active whole-site scrape backend for the current CRAWL_PROVIDER. */
export function isCrawl4aiBackendActive(): boolean {
  return getCrawlProvider() === "crawl4ai" && isCrawl4aiConfigured();
}

export async function mapSite(url: string): Promise<string[]> {
  if (isCrawl4aiBackendActive()) {
    return crawl4aiMapSite(url);
  }
  return firecrawlMapSite(url);
}

export async function scrapeUrl(
  url: string,
  options: ScrapeUrlOptions = {}
): Promise<{ page: CrawledPage | null; links: string[] }> {
  if (isCrawl4aiBackendActive()) {
    return crawl4aiScrapeUrl(url, options);
  }
  return firecrawlScrapeUrl(url, options);
}
