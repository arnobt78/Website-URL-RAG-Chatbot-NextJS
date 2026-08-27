import "server-only";

import { runWithRagChatFallback } from "@/lib/ai/fallback-rag-chat";
import { appendRecentIndexedPage, updateCrawlJob } from "@/lib/crawl/crawl-job-store";
import type { CrawledPage } from "@/lib/crawl/firecrawl-client";
import { pathFromSourceUrl } from "@/lib/crawl/types";

const MIN_PAGE_CHARS = 100;

function formatPageDocument(page: CrawledPage): string {
  const titleLine = page.title ? `Title: ${page.title}\n` : "";
  return `Source: ${page.sourceUrl}\n${titleLine}\n${page.markdown}`;
}

export type IndexPagesResult = {
  indexed: number;
  failed: number;
  totalChars: number;
};

/**
 * Embed crawled pages into Upstash Vector via rag-chat context.add.
 */
export async function indexCrawledPages(
  pages: CrawledPage[],
  namespace: string,
  siteRootKey?: string,
  indexedOffset = 0,
  runId?: string
): Promise<IndexPagesResult> {
  let indexed = 0;
  let failed = 0;
  let totalChars = 0;

  for (const page of pages) {
    if (siteRootKey) {
      const pathLabel = pathFromSourceUrl(page.sourceUrl);
      await updateCrawlJob(
        siteRootKey,
        {
          status: "indexing",
          currentPath: pathLabel,
          phaseDetail: page.label
            ? `Embedding ${pathLabel} (${page.label})…`
            : `Embedding ${pathLabel}…`,
        },
        { expectedRunId: runId }
      );
    }

    if (page.markdown.length < MIN_PAGE_CHARS) {
      failed += 1;
      continue;
    }

    const document = formatPageDocument(page);
    const ingestResult = await runWithRagChatFallback((client) =>
      client.context.add({
        type: "text",
        data: document,
        options: { namespace },
      })
    );

    if (!ingestResult.ok) {
      failed += 1;
      continue;
    }

    const saveResult = ingestResult.result as { success?: boolean; ids?: string[] };
    if (saveResult.success === false || !saveResult.ids?.length) {
      failed += 1;
      continue;
    }

    indexed += 1;
    totalChars += document.length;

    if (siteRootKey) {
      await appendRecentIndexedPage(siteRootKey, page.sourceUrl, indexedOffset + indexed, runId);
    }
  }

  return { indexed, failed, totalChars };
}
