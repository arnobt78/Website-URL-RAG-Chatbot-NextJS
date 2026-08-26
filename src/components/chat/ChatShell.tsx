"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { PromptChips } from "@/components/chat/PromptChips";
import { ChatInput } from "@/components/ChatInput";
import { CHAT_CONTENT_GUTTER } from "@/lib/chat-layout";
import type { ChatPageContext } from "@/types/chat";
import type { ChangeEvent, FormEvent, ReactNode } from "react";

type ChatShellProps = {
  pageContext: ChatPageContext;
  activeChatId?: string;
  mobileSidebarOpen: boolean;
  onMobileSidebarOpenChange: (open: boolean) => void;
  messages: ReactNode;
  input: string;
  isLoading: boolean;
  showComposerChips?: boolean;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e?: FormEvent) => void | Promise<void>;
  onPromptSelect?: (prompt: string) => void;
  onSessionsChange?: () => void;
  refreshToken?: number;
  onRecrawl?: () => void | Promise<void>;
  recrawlLoading?: boolean;
};

export function ChatShell({
  pageContext,
  activeChatId,
  mobileSidebarOpen,
  onMobileSidebarOpenChange,
  messages,
  input,
  isLoading,
  showComposerChips = false,
  onInputChange,
  onSubmit,
  onPromptSelect,
  onSessionsChange,
  refreshToken,
  onRecrawl,
  recrawlLoading,
}: ChatShellProps) {
  return (
    <div className="relative flex h-screen w-full bg-zinc-950">
      <ChatSidebar
        canonicalKey={pageContext.canonicalKey}
        httpsUrl={pageContext.httpsUrl}
        activeChatId={activeChatId}
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={onMobileSidebarOpenChange}
        onSessionsChange={onSessionsChange}
        refreshToken={refreshToken}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          pageContext={pageContext}
          onRecrawl={onRecrawl}
          recrawlLoading={recrawlLoading}
        />

        <div className="flex min-h-0 flex-1 flex-col">{messages}</div>

        {showComposerChips && onPromptSelect ? (
          <div className={`shrink-0 pb-2 pt-1 ${CHAT_CONTENT_GUTTER}`}>
            <PromptChips onSelect={onPromptSelect} />
          </div>
        ) : null}

        <ChatInput
          input={input}
          handleInputChange={onInputChange}
          handleSubmit={onSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export type { ChatPageContext };
