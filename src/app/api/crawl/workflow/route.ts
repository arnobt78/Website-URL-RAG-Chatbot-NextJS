import { serve } from "@upstash/workflow/nextjs";

import { getCrawlInteractMaxPages, getCrawlMaxPages } from "@/lib/crawl/config";
import { CRAWL_USER_ERRORS } from "@/lib/crawl/crawl-errors";
import { getCrawlJob, updateCrawlJob, markCrawlJobFailed } from "@/lib/crawl/crawl-job-store";
import { saveIndexSnapshot } from "@/lib/crawl/index-snapshot";
import type { CrawledPage } from "@/lib/crawl/firecrawl-client";
import { indexCrawledPages } from "@/lib/crawl/index-pages";
import { mapSite } from "@/lib/crawl/scrape-provider";
import { scrapeCrawlTargets } from "@/lib/crawl/scrape-targets";
import type { CrawlWorkflowPayload } from "@/lib/crawl/trigger-crawl";
import { buildCrawlPlan } from "@/lib/crawl/url-expander";
import { prioritizeSiteUrls, selectUrlsForCrawl } from "@/lib/crawl/url-prioritizer";
import { indexRedisKey } from "@/lib/ingest-constants";
import { redis } from "@/lib/redis";

const SCRAPE_BATCH_SIZE = 4;
const INDEX_BATCH_SIZE = 4;

export const { POST } = serve<CrawlWorkflowPayload>(
  async (context) => {
    const payload = context.requestPayload;
    const { runId } = payload;

    await context.run("init", async () => {
      await updateCrawlJob(payload.siteRootKey, { status: "mapping" }, { expectedRunId: runId });
    });

    const targets = await context.run("map", async () => {
      let links: string[] = [];
      try {
        links = await mapSite(payload.siteOriginUrl);
      } catch {
        links = [payload.siteOriginUrl];
      }

      const prioritized = prioritizeSiteUrls(
        links.length > 0 ? links : [payload.siteOriginUrl],
        payload.siteOriginUrl
      );
      const maxPages = getCrawlMaxPages();
      const selected = selectUrlsForCrawl(
        prioritized.length > 0 ? prioritized : [payload.siteOriginUrl],
        maxPages
      );

      const finalTargets = buildCrawlPlan(selected, payload.siteOriginUrl, maxPages);

      await updateCrawlJob(
        payload.siteRootKey,
        {
          status: "crawling",
          discovered: finalTargets.length,
          crawled: 0,
        },
        { expectedRunId: runId }
      );

      return finalTargets;
    });

    const allPages: CrawledPage[] = [];
    let scrapeFailed = 0;
    let interactRemaining = getCrawlInteractMaxPages();

    for (let i = 0; i < targets.length; i += SCRAPE_BATCH_SIZE) {
      const batch = targets.slice(i, i + SCRAPE_BATCH_SIZE);
      const batchIndex = Math.floor(i / SCRAPE_BATCH_SIZE);
      const remainingForBatch = interactRemaining;
      const batchResult = await context.run(`scrape-batch-${batchIndex}`, async () =>
        scrapeCrawlTargets(
          batch,
          payload.siteRootKey,
          allPages.length,
          runId,
          remainingForBatch
        )
      );
      allPages.push(...batchResult.pages);
      scrapeFailed += batchResult.failed;
      interactRemaining = batchResult.interactRemaining;
    }

    if (allPages.length === 0) {
      await markCrawlJobFailed(
        payload.siteRootKey,
        "No pages could be scraped from this site.",
        runId
      );
      throw new Error("No pages could be scraped from this site.");
    }

    await context.run("indexing-start", async () => {
      await updateCrawlJob(
        payload.siteRootKey,
        {
          crawled: allPages.length,
          status: "indexing",
        },
        { expectedRunId: runId }
      );
    });

    let indexResult = { indexed: 0, failed: 0, totalChars: 0 };
    for (let i = 0; i < allPages.length; i += INDEX_BATCH_SIZE) {
      const batch = allPages.slice(i, i + INDEX_BATCH_SIZE);
      const batchIndex = Math.floor(i / INDEX_BATCH_SIZE);
      const batchResult = await context.run(`index-batch-${batchIndex}`, async () =>
        indexCrawledPages(batch, payload.namespace, payload.siteRootKey, indexResult.indexed, runId)
      );
      indexResult = {
        indexed: indexResult.indexed + batchResult.indexed,
        failed: indexResult.failed + batchResult.failed,
        totalChars: indexResult.totalChars + batchResult.totalChars,
      };
    }

    await context.run("complete", async () => {
      if (indexResult.indexed === 0) {
        await updateCrawlJob(
          payload.siteRootKey,
          {
            status: "failed",
            error: CRAWL_USER_ERRORS.NO_PAGES_INDEXED,
            phaseDetail: CRAWL_USER_ERRORS.NO_PAGES_INDEXED,
            indexed: 0,
            failed: indexResult.failed + scrapeFailed,
          },
          { expectedRunId: runId }
        );
        return;
      }

      await redis.sadd("indexed-urls", indexRedisKey(payload.siteRootKey));
      await updateCrawlJob(
        payload.siteRootKey,
        {
          status: "completed",
          indexed: indexResult.indexed,
          failed: indexResult.failed + scrapeFailed,
          phaseDetail: undefined,
          currentPath: undefined,
        },
        { expectedRunId: runId }
      );

      const completedJob = await getCrawlJob(payload.siteRootKey);
      await saveIndexSnapshot(payload.siteRootKey, {
        indexed: indexResult.indexed,
        discovered: completedJob?.discovered,
        indexedPages: completedJob?.indexedPages,
      });
    });

    return {
      indexed: indexResult.indexed,
      failed: indexResult.failed + scrapeFailed,
      totalChars: indexResult.totalChars,
    };
  },
  {
    failureFunction: async ({ context, failResponse }) => {
      const payload = context.requestPayload as CrawlWorkflowPayload | undefined;
      if (payload?.siteRootKey) {
        await markCrawlJobFailed(
          payload.siteRootKey,
          failResponse?.slice(0, 500) || "Site crawl workflow failed.",
          payload.runId
        );
      }
    },
  }
);
