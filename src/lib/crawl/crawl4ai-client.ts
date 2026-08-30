import "server-only";

import {
  getCrawl4aiApiToken,
  getCrawl4aiBaseUrl,
} from "@/lib/crawl/config";
import type { CrawledPage, FirecrawlAction, ScrapeUrlOptions } from "@/lib/crawl/firecrawl-client";
import { MIN_SCRAPE_CHARS } from "@/lib/crawl/firecrawl-client";

type Crawl4aiMdResponse = {
  success?: boolean;
  markdown?: string;
  url?: string;
  error?: string;
  detail?: string;
};

type Crawl4aiLinkItem = string | { href?: string };

type Crawl4aiCrawlResult = {
  url?: string;
  success?: boolean;
  markdown?: string | { raw_markdown?: string; fit_markdown?: string };
  links?: { internal?: Crawl4aiLinkItem[]; external?: Crawl4aiLinkItem[] } | Crawl4aiLinkItem[];
  metadata?: { title?: string };
  error_message?: string;
};

type Crawl4aiCrawlResponse = {
  success?: boolean;
  results?: Crawl4aiCrawlResult[];
  error?: string;
  detail?: string;
};

function authHeaders(): Record<string, string> {
  const token = getCrawl4aiApiToken();
  if (!token) {
    throw new Error("CRAWL4AI_API_TOKEN is not configured.");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function baseUrl(): string {
  const url = getCrawl4aiBaseUrl();
  if (!url) {
    throw new Error("CRAWL4AI_BASE_URL is not configured.");
  }
  return url;
}

async function crawl4aiFetch<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = 120_000
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = (await res.json()) as T & { error?: string; detail?: string };
  if (!res.ok) {
    const msg =
      typeof body.detail === "string"
        ? body.detail
        : body.error ?? `Crawl4AI request failed (${res.status})`;
    throw new Error(msg);
  }
  return body;
}

function markdownFromResult(result: Crawl4aiCrawlResult | undefined): string {
  if (!result) return "";
  const md = result.markdown;
  if (typeof md === "string") return md.trim();
  if (md && typeof md === "object") {
    return (md.fit_markdown ?? md.raw_markdown ?? "").trim();
  }
  return "";
}

function linkHref(item: Crawl4aiLinkItem): string | undefined {
  return typeof item === "string" ? item : item.href;
}

function linksFromResult(result: Crawl4aiCrawlResult | undefined): string[] {
  if (!result?.links) return [];
  const items: Crawl4aiLinkItem[] = Array.isArray(result.links)
    ? result.links
    : [...(result.links.internal ?? []), ...(result.links.external ?? [])];
  return items.map(linkHref).filter((u): u is string => Boolean(u));
}

function pageFromMarkdown(
  url: string,
  markdown: string,
  title?: string
): CrawledPage | null {
  const trimmed = markdown.trim();
  if (!trimmed) return null;
  return { markdown: trimmed, sourceUrl: url, title };
}

/** Discover same-site URLs via Crawl4AI /crawl (depth-limited). */
export async function crawl4aiMapSite(url: string): Promise<string[]> {
  const body = await crawl4aiFetch<Crawl4aiCrawlResponse>("/crawl", {
    method: "POST",
    body: JSON.stringify({
      urls: [url],
      crawler_config: {
        type: "CrawlerRunConfig",
        params: {
          cache_mode: "BYPASS",
          stream: false,
        },
      },
    }),
  });

  const links = new Set<string>([url]);
  for (const result of body.results ?? []) {
    if (result.url) links.add(result.url);
    for (const href of linksFromResult(result)) {
      try {
        const origin = new URL(url).origin;
        if (href.startsWith(origin) || href.startsWith("/")) {
          links.add(href.startsWith("http") ? href : new URL(href, origin).href);
        }
      } catch {
        /* skip bad href */
      }
    }
  }
  return [...links];
}

export async function crawl4aiScrapeUrl(
  url: string,
  options: ScrapeUrlOptions = {}
): Promise<{ page: CrawledPage | null; links: string[] }> {
  const jsScripts = (options.actions ?? [])
    .filter((a): a is Extract<FirecrawlAction, { type: "executeJavascript" }> =>
      a.type === "executeJavascript"
    )
    .map((a) => a.script);

  if (jsScripts.length > 0) {
    try {
      const body = await crawl4aiFetch<Crawl4aiCrawlResponse>(
        "/crawl",
        {
          method: "POST",
          body: JSON.stringify({
            urls: [url],
            crawler_config: {
              type: "CrawlerRunConfig",
              params: {
                cache_mode: "BYPASS",
                js_code: jsScripts,
                delay_before_return_html: Math.max(1, (options.waitFor ?? 2000) / 1000),
              },
            },
          }),
        },
        180_000
      );
      const result = body.results?.[0];
      const markdown = markdownFromResult(result);
      return {
        page: pageFromMarkdown(url, markdown, result?.metadata?.title),
        links: linksFromResult(result),
      };
    } catch {
      /* fall through to /md */
    }
  }

  const body = await crawl4aiFetch<Crawl4aiMdResponse>("/md", {
    method: "POST",
    body: JSON.stringify({
      url,
      f: options.onlyMainContent === false ? "raw" : "fit",
    }),
  });

  const markdown = body.markdown?.trim() ?? "";
  return {
    page: pageFromMarkdown(url, markdown),
    links: [],
  };
}

export { MIN_SCRAPE_CHARS };
