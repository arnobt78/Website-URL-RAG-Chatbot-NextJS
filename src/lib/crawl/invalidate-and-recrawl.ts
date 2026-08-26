import "server-only";

import { runWithRagChatFallback } from "@/lib/ai/fallback-rag-chat";
import { deleteCrawlJob } from "@/lib/crawl/crawl-job-store";
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
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: "Too many site crawl requests. Please wait an hour and try again.",
    };
  }

  if (!isFirecrawlConfigured()) {
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: "Site crawl is not configured. Add FIRECRAWL_API_KEY to enable whole-site indexing.",
    };
  }

  if (!isWorkflowConfigured()) {
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: "Background crawl is not configured. Add QSTASH_TOKEN to enable whole-site indexing.",
    };
  }

  const invalidated = await invalidateSiteIndex(args.siteRootKey, args.namespace);
  if (!invalidated.ok) {
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: invalidated.error,
    };
  }

  return startSiteCrawl({ ...args, force: true, skipRateLimit: true });
}
