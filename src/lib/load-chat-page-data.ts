import "server-only";

import { runWithRagChatFallback } from "@/lib/ai/fallback-rag-chat";
import { getCrawlJob, type CrawlJobRecord } from "@/lib/crawl/crawl-job-store";
import { getCrawlProvider, isFirecrawlConfigured, isWorkflowConfigured } from "@/lib/crawl/config";
import { getIndexSnapshot, saveIndexSnapshot } from "@/lib/crawl/index-snapshot";
import {
  ACTIVE_CRAWL_STATUSES,
  crawlStatusFromJob,
  startSiteCrawl,
  type SiteCrawlStatus,
} from "@/lib/crawl/site-crawl";
import { pathFromSourceUrl, crawlProgressPageCount } from "@/lib/crawl/types";
import { fetchPageContentAsText } from "@/lib/fetch-page-content";
import { indexRedisKey } from "@/lib/ingest-constants";
import { allowIngestRequest } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";
import type { CrawlJobPhase } from "@/lib/crawl/types";
import type { ChatMessage } from "@/types/chat";

type LoadChatPageDataArgs = {
  sessionId: string;
  httpsUrl: string;
  canonicalKey: string;
  siteRootKey: string;
  namespace: string;
  isSiteAlreadyIndexed: boolean;
  clientIp: string;
};

export type CrawlStatus = SiteCrawlStatus;

export type LoadChatPageDataResult = {
  initialMessages: ChatMessage[];
  indexed: boolean;
  ingestError?: string;
  ingestedCharCount?: number;
  siteRootKey: string;
  crawlStatus: CrawlStatus;
  crawlJobPhase?: CrawlJobPhase;
  crawledPageCount?: number;
  discoveredPageCount?: number;
  recentPages?: string[];
  indexedPages?: string[];
  currentPath?: string;
  phaseDetail?: string;
};

function jobProgressFields(job: CrawlJobRecord | null): Pick<
  LoadChatPageDataResult,
  | "crawlStatus"
  | "crawlJobPhase"
  | "crawledPageCount"
  | "discoveredPageCount"
  | "recentPages"
  | "indexedPages"
  | "currentPath"
  | "phaseDetail"
> {
  if (!job) {
    return { crawlStatus: "idle" };
  }
  const phase = job.status;
  return {
    crawlStatus: crawlStatusFromJob(job),
    crawlJobPhase: phase,
    crawledPageCount: crawlProgressPageCount(phase, job.crawled, job.indexed),
    discoveredPageCount: job.discovered,
    recentPages: job.recentPages,
    indexedPages: job.indexedPages,
    currentPath: job.currentPath,
    phaseDetail: job.phaseDetail,
  };
}

async function ingestSinglePageJina(
  httpsUrl: string,
  namespace: string,
  indexKey: string,
  siteRootKey: string
): Promise<
  | { ok: true; ingestedCharCount: number }
  | { ok: false; ingestError: string }
> {
  const pageContent = await fetchPageContentAsText(httpsUrl);
  if (!pageContent.ok) {
    return { ok: false, ingestError: pageContent.reason };
  }

  const ingestResult = await runWithRagChatFallback((client) =>
    client.context.add({
      type: "text",
      data: pageContent.text,
      options: { namespace },
    })
  );

  if (!ingestResult.ok) {
    return { ok: false, ingestError: ingestResult.subtitle };
  }

  const saveResult = ingestResult.result as { success?: boolean; ids?: string[] };
  if (saveResult.success === false || !saveResult.ids?.length) {
    return {
      ok: false,
      ingestError: "Indexing produced no searchable content. Try a different page.",
    };
  }

  await redis.sadd("indexed-urls", indexKey);
  await saveIndexSnapshot(siteRootKey, {
    indexed: 1,
    indexedPages: [pathFromSourceUrl(httpsUrl)],
  });

  return { ok: true, ingestedCharCount: pageContent.text.length };
}

/**
 * Loads chat history and indexes the site when needed.
 * Whole-site crawl via Firecrawl + Upstash Workflow, or Jina single-page fallback.
 */
export async function loadChatPageData({
  sessionId,
  httpsUrl,
  canonicalKey,
  siteRootKey,
  namespace,
  isSiteAlreadyIndexed,
  clientIp,
}: LoadChatPageDataArgs): Promise<LoadChatPageDataResult> {
  const historyResult = await runWithRagChatFallback((client) =>
    client.history.getMessages({
      amount: 10,
      sessionId,
    })
  );

  if (!historyResult.ok) {
    return {
      initialMessages: [],
      indexed: isSiteAlreadyIndexed,
      ingestError: historyResult.subtitle,
      siteRootKey,
      crawlStatus: "idle",
    };
  }

  const initialMessages = historyResult.result as ChatMessage[];
  const existingJob = await getCrawlJob(siteRootKey);

  if (isSiteAlreadyIndexed) {
    const snapshot = existingJob ? null : await getIndexSnapshot(siteRootKey);
    return {
      initialMessages,
      indexed: true,
      siteRootKey,
      crawlStatus: "completed",
      crawledPageCount: existingJob?.indexed ?? snapshot?.indexed,
      discoveredPageCount: existingJob?.discovered ?? snapshot?.discovered,
      recentPages: existingJob?.recentPages ?? snapshot?.indexedPages?.slice(-5),
      indexedPages: existingJob?.indexedPages ?? snapshot?.indexedPages,
    };
  }

  const provider = getCrawlProvider();
  const useSiteCrawl =
    provider === "firecrawl" && isFirecrawlConfigured() && isWorkflowConfigured();

  if (!useSiteCrawl) {
    const allowed = await allowIngestRequest(clientIp);
    if (!allowed) {
      return {
        initialMessages,
        indexed: false,
        ingestError: "Too many indexing requests. Please wait a minute and try again.",
        siteRootKey,
        crawlStatus: "idle",
      };
    }

    const single = await ingestSinglePageJina(
      httpsUrl,
      namespace,
      indexRedisKey(siteRootKey),
      siteRootKey
    );
    if (!single.ok) {
      return {
        initialMessages,
        indexed: false,
        ingestError: single.ingestError,
        siteRootKey,
        crawlStatus: "failed",
      };
    }

    return {
      initialMessages,
      indexed: true,
      ingestedCharCount: single.ingestedCharCount,
      siteRootKey,
      crawlStatus: "completed",
      crawledPageCount: 1,
      indexedPages: [pathFromSourceUrl(httpsUrl)],
    };
  }

  if (existingJob && ACTIVE_CRAWL_STATUSES.has(existingJob.status)) {
    return {
      initialMessages,
      indexed: false,
      siteRootKey,
      ...jobProgressFields(existingJob),
    };
  }

  const started = await startSiteCrawl({ siteRootKey, namespace, clientIp });
  if (!started.ok) {
    return {
      initialMessages,
      indexed: false,
      ingestError: started.ingestError,
      siteRootKey,
      crawlStatus: started.crawlStatus,
      crawledPageCount: existingJob?.indexed,
      discoveredPageCount: existingJob?.discovered,
    };
  }

  return {
    initialMessages,
    indexed: false,
    siteRootKey,
    ...jobProgressFields(started.job),
  };
}
