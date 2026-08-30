import "server-only";

import {
  createCrawlJob,
  getCrawlJob,
  type CrawlJobRecord,
} from "@/lib/crawl/crawl-job-store";
import {
  CRAWL_USER_ERRORS,
  logCrawlEvent,
} from "@/lib/crawl/crawl-errors";
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
    logCrawlEvent("crawl_fail", {
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
    logCrawlEvent("crawl_fail", {
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
    logCrawlEvent("crawl_fail", {
      reason: "missing_qstash",
      siteRootKey: args.siteRootKey,
    });
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: CRAWL_USER_ERRORS.MISSING_QSTASH,
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
    runId: job.runId,
  });

  if (!triggered) {
    await redis.del(`crawl:job:${args.siteRootKey}`);
    logCrawlEvent("crawl_fail", {
      reason: "workflow_trigger",
      siteRootKey: args.siteRootKey,
      runId: job.runId,
    });
    return {
      ok: false,
      crawlStatus: "failed",
      ingestError: CRAWL_USER_ERRORS.WORKFLOW_START_FAILED,
    };
  }

  logCrawlEvent("crawl_start", {
    siteRootKey: args.siteRootKey,
    runId: job.runId,
    force: Boolean(args.force),
  });

  return { ok: true, job };
}
