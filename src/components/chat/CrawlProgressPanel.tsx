"use client";

import { crawlStepTitle, type CrawlJobPhase } from "@/lib/crawl/types";
import { Loader2 } from "lucide-react";

type CrawlProgressPanelProps = {
  crawlJobPhase?: CrawlJobPhase | string;
  crawledPageCount?: number;
  discoveredPageCount?: number;
  recentPages?: string[];
  currentPath?: string;
  phaseDetail?: string;
};

export function CrawlProgressPanel({
  crawlJobPhase,
  crawledPageCount = 0,
  discoveredPageCount = 0,
  recentPages = [],
  currentPath,
  phaseDetail,
}: CrawlProgressPanelProps) {
  const stepTitle = crawlStepTitle(crawlJobPhase);
  const isEmbedding = crawlJobPhase === "indexing";
  const hasCounter = discoveredPageCount > 0;
  const progressLabel = isEmbedding ? "Embedding" : "Crawling";
  const progressRatio = hasCounter
    ? Math.min(100, Math.round((crawledPageCount / discoveredPageCount) * 100))
    : 0;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <Loader2 className="size-10 animate-spin text-sky-400" aria-hidden="true" />

      <div className="space-y-1 text-center">
        <p className="text-base font-medium text-white">{stepTitle}</p>
        {phaseDetail ? (
          <p className="text-xs text-zinc-500">{phaseDetail}</p>
        ) : currentPath ? (
          <p className="text-xs font-mono text-zinc-500">{currentPath}</p>
        ) : null}
        {hasCounter ? (
          <p className="text-sm text-zinc-400">
            {progressLabel} {crawledPageCount} / {discoveredPageCount} pages
          </p>
        ) : (
          <p className="text-sm text-zinc-400">This may take a minute.</p>
        )}
      </div>

      {hasCounter ? (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800"
          role="progressbar"
          aria-valuenow={progressRatio}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Crawl progress"
        >
          <div
            className="h-full rounded-full bg-sky-500 transition-all duration-500"
            style={{ width: `${Math.max(progressRatio, crawledPageCount > 0 ? 4 : 0)}%` }}
          />
        </div>
      ) : null}

      {recentPages.length > 0 ? (
        <div className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Recently indexed
          </p>
          <ul className="space-y-0.5 font-mono text-xs text-zinc-400">
            {recentPages.slice(-5).map((path) => (
              <li key={path} className="truncate">
                {path}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
