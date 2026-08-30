import "server-only";

import { runWithRagChatFallback } from "@/lib/ai/fallback-rag-chat";
import { deleteCrawlJob } from "@/lib/crawl/crawl-job-store";
import {
  CRAWL_USER_ERRORS,
  logCrawlEvent,
} from "@/lib/crawl/crawl-errors";
import { deleteIndexSnapshot } from "@/lib/crawl/index-snapshot";
import { startSiteCrawl, type SiteCrawlStatus } from "@/lib/crawl/site-crawl";
import type { CrawlJobRecord } from "@/lib/crawl/crawl-job-store";
import {
  isFirecrawlConfigured,
  isWorkflowConfigured,
} from "@/lib/crawl/config";
import { indexRedisKey } from "@/lib/ingest-constants";
import { allowCrawlRequest } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";

export async function invalidateSiteIndex(
  siteRootKey: string,
  namespace: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const deleteResult = await runWithRagChatFallback((client) =>
    client.context.deleteEntireContext({ namespace })
  );

  if (!deleteResult.ok) {
    return { ok: false, error: deleteResult.subtitle };
  }

  await redis.srem("indexed-urls", indexRedisKey(siteRootKey));
  await deleteCrawlJob(siteRootKey);
  await deleteIndexSnapshot(siteRootKey);

  return { ok: true };
}

export async function recrawlSite(args: {
  siteRootKey: string;
  namespace: string;
  clientIp: string;
}): Promise<
  | { ok: true; job: CrawlJobRecord }
  | { ok: false; ingestError: string; crawlStatus: SiteCrawlStatus }
> {
  if (!(await allowCrawlRequest(args.clientIp))) {
    logCrawlEvent("recrawl_fail", {
      reason: "rate_limited",
      siteRootKey: args.siteRootKey,
    });
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: CRAWL_USER_ERRORS.RATE_LIMITED,
    };
  }

  if (!isFirecrawlConfigured()) {
    logCrawlEvent("recrawl_fail", {
      reason: "missing_firecrawl",
      siteRootKey: args.siteRootKey,
    });
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: CRAWL_USER_ERRORS.MISSING_FIRECRAWL,
    };
  }

  if (!isWorkflowConfigured()) {
    logCrawlEvent("recrawl_fail", {
      reason: "missing_qstash",
      siteRootKey: args.siteRootKey,
    });
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: CRAWL_USER_ERRORS.MISSING_QSTASH,
    };
  }

  const invalidated = await invalidateSiteIndex(args.siteRootKey, args.namespace);
  if (!invalidated.ok) {
    logCrawlEvent("recrawl_fail", {
      reason: "invalidate",
      siteRootKey: args.siteRootKey,
    });
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: invalidated.error,
    };
  }

  return startSiteCrawl({ ...args, force: true, skipRateLimit: true });
}
