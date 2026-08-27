import "server-only";

import { redis } from "@/lib/redis";

import { getCrawlMaxPages } from "@/lib/crawl/config";
import type { CrawlJobPhase } from "@/lib/crawl/types";
import { pathFromSourceUrl } from "@/lib/crawl/types";

export type CrawlJobStatus = CrawlJobPhase;

export type CrawlJobRecord = {
  status: CrawlJobStatus;
  siteRootKey: string;
  siteOriginUrl: string;
  namespace: string;
  /** Unique per crawl run — stale workflow steps ignore mismatched jobs. */
  runId: string;
  discovered: number;
  crawled: number;
  indexed: number;
  failed: number;
  recentPages?: string[];
  indexedPages?: string[];
  currentPath?: string;
  phaseDetail?: string;
  startedAt: string;
  updatedAt: string;
  error?: string;
};

export type UpdateCrawlJobOptions = {
  expectedRunId?: string;
};

const JOB_TTL_SECONDS = 60 * 60 * 24 * 7;

function jobKey(siteRootKey: string): string {
  return `crawl:job:${siteRootKey}`;
}

export async function getCrawlJob(siteRootKey: string): Promise<CrawlJobRecord | null> {
  const raw = await redis.get<string>(jobKey(siteRootKey));
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as CrawlJobRecord;
    } catch {
      return null;
    }
  }
  return raw as CrawlJobRecord;
}

export async function saveCrawlJob(job: CrawlJobRecord): Promise<void> {
  await redis.set(jobKey(job.siteRootKey), JSON.stringify(job), { ex: JOB_TTL_SECONDS });
}

export async function updateCrawlJob(
  siteRootKey: string,
  patch: Partial<CrawlJobRecord>,
  options?: UpdateCrawlJobOptions
): Promise<CrawlJobRecord | null> {
  const existing = await getCrawlJob(siteRootKey);
  if (!existing) return null;
  if (existing.runId && options?.expectedRunId !== existing.runId) {
    return existing;
  }
  const updated: CrawlJobRecord = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await saveCrawlJob(updated);
  return updated;
}

export async function createCrawlJob(args: {
  siteRootKey: string;
  siteOriginUrl: string;
  namespace: string;
}): Promise<CrawlJobRecord> {
  const now = new Date().toISOString();
  const job: CrawlJobRecord = {
    status: "pending",
    siteRootKey: args.siteRootKey,
    siteOriginUrl: args.siteOriginUrl,
    namespace: args.namespace,
    runId: crypto.randomUUID(),
    discovered: 0,
    crawled: 0,
    indexed: 0,
    failed: 0,
    startedAt: now,
    updatedAt: now,
  };
  await saveCrawlJob(job);
  return job;
}

export async function appendRecentIndexedPage(
  siteRootKey: string,
  sourceUrl: string,
  indexedCount: number,
  expectedRunId?: string
): Promise<void> {
  const existing = await getCrawlJob(siteRootKey);
  if (!existing) return;
  if (existing.runId && expectedRunId !== existing.runId) return;

  const path = pathFromSourceUrl(sourceUrl);
  const recent = [...(existing.recentPages ?? [])];
  if (!recent.includes(path)) {
    recent.push(path);
  }

  const indexed = [...(existing.indexedPages ?? [])];
  if (!indexed.includes(path)) {
    indexed.push(path);
  }
  const maxPages = getCrawlMaxPages();

  await updateCrawlJob(
    siteRootKey,
    {
      recentPages: recent.slice(-5),
      indexedPages: indexed.slice(0, maxPages),
      indexed: indexedCount,
    },
    { expectedRunId }
  );
}

export async function markCrawlJobFailed(
  siteRootKey: string,
  error: string,
  expectedRunId?: string
): Promise<void> {
  await updateCrawlJob(
    siteRootKey,
    {
      status: "failed",
      error: error.slice(0, 500),
    },
    { expectedRunId }
  );
}

export async function deleteCrawlJob(siteRootKey: string): Promise<void> {
  await redis.del(jobKey(siteRootKey));
}
