"use client";

import type { ChatPageContext } from "@/types/chat";
import { CHAT_HEADER_GUTTER } from "@/lib/chat-layout";
import { AlertTriangle, CheckCircle2, ExternalLink, Globe } from "lucide-react";

type ChatHeaderProps = {
  pageContext: ChatPageContext;
};

function displayHost(httpsUrl: string): string {
  try {
    const url = new URL(httpsUrl);
    return url.hostname + url.pathname.replace(/\/$/, "") + url.search;
  } catch {
    return httpsUrl;
  }
}

export function ChatHeader({ pageContext }: ChatHeaderProps) {
  const { httpsUrl, indexed, ingestError } = pageContext;
  const host = displayHost(httpsUrl);

  const badge = ingestError
    ? { label: "Limited", className: "bg-amber-950/50 text-amber-300 border-amber-800" }
    : indexed
      ? { label: "Indexed", className: "bg-emerald-950/50 text-emerald-300 border-emerald-800" }
      : { label: "Ready", className: "bg-zinc-800 text-zinc-300 border-zinc-600" };

  return (
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
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {ingestError ? (
              <AlertTriangle className="size-3" aria-hidden="true" />
            ) : indexed ? (
              <CheckCircle2 className="size-3" aria-hidden="true" />
            ) : null}
            {badge.label}
          </span>
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
  );
}
