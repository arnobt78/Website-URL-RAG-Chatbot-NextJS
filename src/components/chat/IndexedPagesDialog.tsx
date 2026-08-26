"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { FileText, RefreshCw } from "lucide-react";
import { useState } from "react";

type IndexedPagesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  host: string;
  pageCount: number;
  pages: string[];
  ingestedCharCount?: number;
  canRecrawl?: boolean;
  recrawlLoading?: boolean;
  onRecrawl?: () => void | Promise<void>;
};

function formatCharCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M chars`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k chars`;
  return `${n} chars`;
}

export function IndexedPagesDialog({
  open,
  onOpenChange,
  host,
  pageCount,
  pages,
  ingestedCharCount,
  canRecrawl = false,
  recrawlLoading = false,
  onRecrawl,
}: IndexedPagesDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const summaryParts = [`${pageCount} page${pageCount === 1 ? "" : "s"}`];
  if (ingestedCharCount && ingestedCharCount > 0) {
    summaryParts.push(formatCharCount(ingestedCharCount));
  }

  const handleConfirmRecrawl = async () => {
    setConfirmOpen(false);
    onOpenChange(false);
    await onRecrawl?.();
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={`Indexed pages · ${host}`}
        description={summaryParts.join(" · ")}
        footer={
          <div className="space-y-3">
            <p>Answers are grounded in these crawled pages.</p>
            {canRecrawl && onRecrawl ? (
              <button
                type="button"
                disabled={recrawlLoading}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`size-4 ${recrawlLoading ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                Re-crawl site
              </button>
            ) : null}
          </div>
        }
      >
        {pages.length > 0 ? (
          <ul className="space-y-1 font-mono text-sm text-zinc-300">
            {pages.map((path) => (
              <li
                key={path}
                className="truncate rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2"
              >
                {path}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-zinc-500">
            <FileText className="size-8 text-zinc-600" aria-hidden="true" />
            <p>
              {pageCount} page{pageCount === 1 ? "" : "s"} indexed — path list unavailable for this
              crawl.
            </p>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Re-crawl this site?"
        description="This clears the indexed content and re-crawls the site. Your chat messages stay in this session. May take 30–90 seconds."
        confirmLabel="Re-crawl"
        cancelLabel="Cancel"
        onConfirm={() => void handleConfirmRecrawl()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
