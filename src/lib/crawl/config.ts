import "server-only";

export type CrawlProvider = "firecrawl" | "jina-single" | "crawl4ai";

const DEFAULT_MAX_PAGES = 100;

export function getCrawlProvider(): CrawlProvider {
  const raw = process.env.CRAWL_PROVIDER?.trim().toLowerCase();
  if (raw === "jina-single") return "jina-single";
  if (raw === "crawl4ai") return "crawl4ai";
  return "firecrawl";
}

export function getCrawlMaxPages(): number {
  const raw = process.env.CRAWL_MAX_PAGES?.trim();
  if (!raw) return DEFAULT_MAX_PAGES;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MAX_PAGES;
  return Math.min(n, 500);
}

export function getFirecrawlApiKey(): string | undefined {
  return process.env.FIRECRAWL_API_KEY?.trim() || undefined;
}

export function getCrawl4aiBaseUrl(): string | undefined {
  const url = process.env.CRAWL4AI_BASE_URL?.trim();
  return url ? url.replace(/\/$/, "") : undefined;
}

export function getCrawl4aiApiToken(): string | undefined {
  return process.env.CRAWL4AI_API_TOKEN?.trim() || undefined;
}

export function isCrawl4aiConfigured(): boolean {
  return Boolean(getCrawl4aiBaseUrl() && getCrawl4aiApiToken());
}

export function getAppBaseUrl(): string {
  const fromEnv = process.env.APP_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function isWorkflowConfigured(): boolean {
  return Boolean(process.env.QSTASH_TOKEN?.trim());
}

/** Optional — defaults to global QStash; use regional URL from Upstash console if needed (e.g. EU). */
export function getQstashBaseUrl(): string | undefined {
  const url = process.env.QSTASH_URL?.trim();
  return url || undefined;
}

export function isFirecrawlConfigured(): boolean {
  return Boolean(getFirecrawlApiKey());
}

/** Whole-site crawl backend ready (Firecrawl or Crawl4AI). Still needs QStash for workflow. */
export function isSiteCrawlBackendConfigured(): boolean {
  const provider = getCrawlProvider();
  if (provider === "crawl4ai") return isCrawl4aiConfigured();
  if (provider === "jina-single") return false;
  return isFirecrawlConfigured();
}

const DEFAULT_MAX_ACTIONS = 8;
const DEFAULT_INTERACT_MAX_PAGES = 8;

export function getCrawlMaxActionsPerPage(): number {
  const raw = process.env.CRAWL_MAX_ACTIONS_PER_PAGE?.trim();
  if (!raw) return DEFAULT_MAX_ACTIONS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MAX_ACTIONS;
  return Math.min(n, 50);
}

export function getCrawlInteractMaxPages(): number {
  const raw = process.env.CRAWL_INTERACT_MAX_PAGES?.trim();
  if (!raw) return DEFAULT_INTERACT_MAX_PAGES;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_INTERACT_MAX_PAGES;
  return Math.min(n, 20);
}

export function getCrawlInteractEnabled(): boolean {
  const raw = process.env.CRAWL_INTERACT_ENABLED?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}
