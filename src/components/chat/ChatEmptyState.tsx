"use client";

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
  const { httpsUrl, indexed, ingestError, ingestedCharCount } = pageContext;
  const host = displayHost(httpsUrl);

  let title: string;
  let subtitle: string;

  if (ingestError) {
    title = `Limited context for ${host}`;
    subtitle = ingestError;
  } else if (ingestedCharCount && ingestedCharCount > 0) {
    title = `Indexed ${host}`;
    subtitle = `${ingestedCharCount.toLocaleString()} characters scraped — ask anything about this page.`;
  } else if (indexed) {
    title = `${host} is ready`;
    subtitle = "This page was indexed on a previous visit. Ask your first question to get started.";
  } else {
    title = `Ready to chat about ${host}`;
    subtitle = "Ask your first question to get started.";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-8 text-center">
      {ingestError ? (
        <AlertTriangle className="size-10 text-amber-400" aria-hidden="true" />
      ) : (
        <MessageSquare className="size-10 text-sky-400" aria-hidden="true" />
      )}

      <div className="max-w-lg space-y-2">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-zinc-400">{subtitle}</p>
        {ingestError ? (
          <p className="text-xs text-zinc-500">
            You can still try asking — answers may be limited without full page content.
          </p>
        ) : null}
      </div>
    </div>
  );
}
