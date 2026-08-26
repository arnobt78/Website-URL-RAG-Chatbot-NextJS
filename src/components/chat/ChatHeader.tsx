"use client";

import { IndexedPagesDialog } from "@/components/chat/IndexedPagesDialog";
import { crawlStepTitle } from "@/lib/crawl/types";
import type { ChatPageContext } from "@/types/chat";
import { CHAT_HEADER_GUTTER } from "@/lib/chat-layout";
import { AlertTriangle, CheckCircle2, ExternalLink, Globe, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

type ChatHeaderProps = {
  pageContext: ChatPageContext;
  onRecrawl?: () => void | Promise<void>;
  recrawlLoading?: boolean;
};

function displayHost(httpsUrl: string): string {
  try {
    const url = new URL(httpsUrl);
    return url.hostname + url.pathname.replace(/\/$/, "") + url.search;
  } catch {
    return httpsUrl;
  }
}

export function ChatHeader({
  pageContext,
  onRecrawl,
  recrawlLoading = false,
}: ChatHeaderProps) {
  const {
    httpsUrl,
    indexed,
    ingestError,
    ingestedCharCount,
    crawlStatus,
    crawlJobPhase,
    crawledPageCount,
    indexedPages,
    recentPages,
  } = pageContext;
  const host = displayHost(httpsUrl);
  const [dialogOpen, setDialogOpen] = useState(false);

  let badgeLabel: string;
  let badgeClass: string;
  let BadgeIcon: typeof CheckCircle2 | typeof AlertTriangle | typeof Loader2 | null = null;

  if (ingestError) {
    badgeLabel = "Limited";
    badgeClass = "bg-amber-950/50 text-amber-300 border-amber-800";
    BadgeIcon = AlertTriangle;
  } else if (crawlStatus === "running") {
    badgeLabel = crawlJobPhase ? crawlStepTitle(crawlJobPhase) : "Crawling…";
    badgeClass = "bg-sky-950/50 text-sky-300 border-sky-800";
    BadgeIcon = Loader2;
  } else if (indexed) {
    badgeLabel =
      crawledPageCount && crawledPageCount > 1
        ? `Indexed · ${crawledPageCount} pages`
        : "Indexed";
    badgeClass = "bg-emerald-950/50 text-emerald-300 border-emerald-800";
    BadgeIcon = CheckCircle2;
  } else {
    badgeLabel = "Ready";
    badgeClass = "bg-zinc-800 text-zinc-300 border-zinc-600";
  }

  const dialogPages = useMemo(
    () => indexedPages ?? recentPages ?? [],
    [indexedPages, recentPages]
  );
  const pageCount = crawledPageCount ?? dialogPages.length ?? (indexed ? 1 : 0);
  const badgeClickable = indexed && crawlStatus !== "running";
  const canRecrawl = Boolean(
    indexed && !ingestError && crawlStatus !== "running" && onRecrawl
  );

  const badgeInner = (
    <>
      {BadgeIcon ? (
        <BadgeIcon
          className={`size-3 ${crawlStatus === "running" ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
      ) : null}
      {badgeLabel}
    </>
  );

  return (
    <>
      <header
        className={`shrink-0 border-b border-zinc-800 bg-zinc-900/80 py-3 backdrop-blur ${CHAT_HEADER_GUTTER}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Globe className="size-4 shrink-0 text-sky-400" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-100">{host}</p>
              <p className="text-xs text-zinc-500">Website URL RAG Chat</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {badgeClickable ? (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={dialogOpen}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${badgeClass}`}
              >
                {badgeInner}
              </button>
            ) : (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
              >
                {badgeInner}
              </span>
            )}
            <a
              href={httpsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Open source page in new tab"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </header>

      <IndexedPagesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        host={host}
        pageCount={pageCount}
        pages={dialogPages}
        ingestedCharCount={ingestedCharCount}
        canRecrawl={canRecrawl}
        recrawlLoading={recrawlLoading}
        onRecrawl={onRecrawl}
      />
    </>
  );
}
