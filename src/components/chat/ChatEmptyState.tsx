"use client";

import { CrawlProgressPanel } from "@/components/chat/CrawlProgressPanel";
import type { ChatPageContext } from "@/types/chat";
import { AlertTriangle, MessageSquare } from "lucide-react";

type ChatEmptyStateProps = {
  pageContext: ChatPageContext;
};

function displayHost(httpsUrl: string): string {
  try {
    return new URL(httpsUrl).hostname;
  } catch {
    return httpsUrl;
  }
}

export function ChatEmptyState({ pageContext }: ChatEmptyStateProps) {
  const {
    httpsUrl,
    indexed,
    ingestError,
    ingestedCharCount,
    crawlStatus,
    crawledPageCount,
    crawlJobPhase,
    discoveredPageCount,
    recentPages,
    currentPath,
    phaseDetail,
  } = pageContext;
  const host = displayHost(httpsUrl);
  const isCrawling = crawlStatus === "running";

  let title: string;
  let subtitle: string;

  if (ingestError) {
    title = `Limited context for ${host}`;
    subtitle = ingestError;
  } else if (isCrawling) {
    title = `Indexing ${host}`;
    subtitle = "Chat will unlock automatically when indexing completes.";
  } else if (crawledPageCount && crawledPageCount > 1) {
    title = `${host} is ready`;
    subtitle = `${crawledPageCount} pages indexed — ask anything about this site.`;
  } else if (ingestedCharCount && ingestedCharCount > 0) {
    title = `Indexed ${host}`;
    subtitle = `${ingestedCharCount.toLocaleString()} characters scraped — ask anything about this site.`;
  } else if (indexed) {
    title = `${host} is ready`;
    subtitle = "This site was indexed on a previous visit. Ask your first question to get started.";
  } else {
    title = `Ready to chat about ${host}`;
    subtitle = "Ask your first question to get started.";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-8 text-center">
      {ingestError ? (
        <AlertTriangle className="size-10 text-amber-400" aria-hidden="true" />
      ) : isCrawling ? (
        <CrawlProgressPanel
          crawlJobPhase={crawlJobPhase}
          crawledPageCount={crawledPageCount}
          discoveredPageCount={discoveredPageCount}
          recentPages={recentPages}
          currentPath={currentPath}
          phaseDetail={phaseDetail}
        />
      ) : (
        <MessageSquare className="size-10 text-sky-400" aria-hidden="true" />
      )}

      <div className="max-w-lg space-y-2">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-zinc-400">{subtitle}</p>
        {ingestError && phaseDetail && phaseDetail !== ingestError ? (
          <p className="text-xs text-zinc-500">{phaseDetail}</p>
        ) : null}
        {ingestError ? (
          <p className="text-xs text-zinc-500">
            You can still try asking — answers may be limited without full site content.
          </p>
        ) : null}
      </div>
    </div>
  );
}
