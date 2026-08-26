import "server-only";

import { getFirecrawlApiKey } from "@/lib/crawl/config";

const FIRECRAWL_V1 = "https://api.firecrawl.dev/v1";
const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

export type FirecrawlAction =
  | { type: "wait"; milliseconds?: number; selector?: string }
  | { type: "click"; selector: string; all?: boolean }
  | { type: "write"; text: string }
  | { type: "press"; key: string }
  | { type: "scroll"; direction?: "up" | "down"; selector?: string }
  | { type: "scrape" }
  | { type: "executeJavascript"; script: string };

type FirecrawlMapResponse = {
  success?: boolean;
  links?: string[];
  error?: string;
};

type FirecrawlScrapeData = {
  markdown?: string;
  links?: string[];
  metadata?: { title?: string; sourceURL?: string; url?: string };
  extract?: string;
};

type FirecrawlScrapeResponse = {
  success?: boolean;
  data?: FirecrawlScrapeData;
  error?: string;
};

type FirecrawlV2ScrapeResponse = {
  success?: boolean;
  id?: string;
  data?: FirecrawlScrapeData;
  error?: string;
};

type FirecrawlInteractResponse = {
  success?: boolean;
  data?: { markdown?: string; extract?: string };
  error?: string;
};

export type ScrapeUrlOptions = {
  actions?: FirecrawlAction[];
  waitFor?: number;
  formats?: ("markdown" | "links" | "query")[];
  queryPrompt?: string;
  onlyMainContent?: boolean;
  maxAge?: number;
};

function authHeaders(): Record<string, string> {
  const apiKey = getFirecrawlApiKey();
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not configured.");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function firecrawlFetch<T>(
  base: string,
  path: string,
  init?: RequestInit,
  timeoutMs = 120_000
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });

  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `Firecrawl request failed (${res.status})`);
  }
  return body;
}

export async function firecrawlMapSite(url: string): Promise<string[]> {
  const body = await firecrawlFetch<FirecrawlMapResponse>(FIRECRAWL_V1, "/map", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ url }),
  });

  if (!body.success) {
    throw new Error(body.error ?? "Firecrawl map failed.");
  }

  return body.links ?? [];
}

export type CrawledPage = {
  markdown: string;
  sourceUrl: string;
  title?: string;
  label?: string;
  variantKey?: string;
};

function pageFromScrapeData(
  data: FirecrawlScrapeData | undefined,
  url: string,
  label?: string,
  variantKey?: string
): CrawledPage | null {
  const markdown = data?.markdown?.trim() ?? data?.extract?.trim();
  if (!markdown) return null;
  const meta = data?.metadata;
  let sourceUrl = meta?.sourceURL ?? meta?.url ?? url;
  if (label) {
    sourceUrl = `${sourceUrl} [${label}]`;
  }
  return {
    markdown,
    sourceUrl,
    title: meta?.title,
    label,
    variantKey,
  };
}

export async function firecrawlScrapeUrl(
  url: string,
  options: ScrapeUrlOptions = {}
): Promise<{ page: CrawledPage | null; links: string[] }> {
  const formats = options.formats ?? ["markdown"];
  const bodyPayload: Record<string, unknown> = {
    url,
    formats,
    onlyMainContent: options.onlyMainContent ?? true,
    maxAge: options.maxAge ?? 0,
  };
  if (options.waitFor) bodyPayload.waitFor = options.waitFor;
  if (options.actions?.length) bodyPayload.actions = options.actions;
  if (formats.includes("query") && options.queryPrompt) {
    bodyPayload.query = options.queryPrompt;
  }

  const body = await firecrawlFetch<FirecrawlScrapeResponse>(FIRECRAWL_V1, "/scrape", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(bodyPayload),
  });

  if (!body.success) {
    throw new Error(body.error ?? "Firecrawl scrape failed.");
  }

  return {
    page: pageFromScrapeData(body.data, url),
    links: body.data?.links ?? [],
  };
}

/** Start a v2 scrape session for /interact follow-ups. */
export async function firecrawlScrapeForInteract(url: string): Promise<{
  scrapeId: string;
  page: CrawledPage | null;
}> {
  const body = await firecrawlFetch<FirecrawlV2ScrapeResponse>(
    FIRECRAWL_V2,
    "/scrape",
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        maxAge: 0,
      }),
    },
    120_000
  );

  if (!body.success || !body.id) {
    throw new Error(body.error ?? "Firecrawl v2 scrape did not return a session id.");
  }

  return {
    scrapeId: body.id,
    page: pageFromScrapeData(body.data, url),
  };
}

const INTERACT_PROMPT =
  "Expand all collapsed sections on this page (tabs, accordions, FAQ items, Read more toggles). " +
  "Do not submit forms or navigate away from this site. Return markdown of all visible text content.";

export async function firecrawlInteract(
  scrapeId: string,
  prompt: string = INTERACT_PROMPT
): Promise<CrawledPage | null> {
  const body = await firecrawlFetch<FirecrawlInteractResponse>(
    FIRECRAWL_V2,
    `/scrape/${encodeURIComponent(scrapeId)}/interact`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ prompt }),
    },
    180_000
  );

  if (!body.success) {
    throw new Error(body.error ?? "Firecrawl interact failed.");
  }

  const markdown = body.data?.markdown?.trim() ?? body.data?.extract?.trim();
  if (!markdown) return null;

  return {
    markdown,
    sourceUrl: `interact:${scrapeId}`,
    label: "interact",
  };
}

export const MIN_SCRAPE_CHARS = 100;
