import "server-only";

import {
  createCrawlJob,
  getCrawlJob,
  type CrawlJobRecord,
} from "@/lib/crawl/crawl-job-store";
import {
  isFirecrawlConfigured,
  isWorkflowConfigured,
} from "@/lib/crawl/config";
import { siteOriginHttpsUrl } from "@/lib/crawl/site-root";
import { triggerCrawlWorkflow } from "@/lib/crawl/trigger-crawl";
import { allowCrawlRequest } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";

export type SiteCrawlStatus = "idle" | "running" | "failed" | "completed";

export const ACTIVE_CRAWL_STATUSES = new Set<CrawlJobRecord["status"]>([
  "pending",
  "mapping",
  "crawling",
  "indexing",
]);

export function crawlStatusFromJob(job: CrawlJobRecord): SiteCrawlStatus {
  if (job.status === "completed") return "completed";
  if (job.status === "failed") return "failed";
  if (ACTIVE_CRAWL_STATUSES.has(job.status)) return "running";
  return "idle";
}

export async function startSiteCrawl(args: {
  siteRootKey: string;
  namespace: string;
  clientIp: string;
  force?: boolean;
  skipRateLimit?: boolean;
}): Promise<
  | { ok: true; job: CrawlJobRecord }
  | { ok: false; ingestError: string; crawlStatus: SiteCrawlStatus }
> {
  const existing = await getCrawlJob(args.siteRootKey);
  if (!args.force && existing && ACTIVE_CRAWL_STATUSES.has(existing.status)) {
    return { ok: true, job: existing };
  }

  if (!args.skipRateLimit && !(await allowCrawlRequest(args.clientIp))) {
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

  const siteOriginUrl = siteOriginHttpsUrl(args.siteRootKey);
  const job = await createCrawlJob({
    siteRootKey: args.siteRootKey,
    siteOriginUrl,
    namespace: args.namespace,
  });

  const triggered = await triggerCrawlWorkflow({
    siteRootKey: args.siteRootKey,
    siteOriginUrl,
    namespace: args.namespace,
  });

  if (!triggered) {
    await redis.del(`crawl:job:${args.siteRootKey}`);
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: "Could not start site crawl workflow.",
    };
  }

  return { ok: true, job };
}
