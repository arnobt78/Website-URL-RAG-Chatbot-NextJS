"use client";

import { ChatShell } from "@/components/chat/ChatShell";
import { Messages } from "@/components/Messages";
import { parseChatErrorResponse } from "@/lib/chat-errors";
import {
  ensureSessionForUrl,
  isLegacyChatId,
  titleFromFirstMessage,
  touchSession,
  upsertSession,
} from "@/lib/chat-sessions-storage";
import {
  clearChatNavActive,
  completeChatNavToast,
  failIngestChatNavToast,
} from "@/lib/chat-navigation-ticker";
import {
  mergeLiveCrawlContext,
  type LiveCrawlPoll,
} from "@/lib/crawl/live-crawl-context";
import type { CrawlJobPhase } from "@/lib/crawl/types";
import { crawlStatusPollFailure } from "@/lib/crawl/status-poll-errors";
import type { ChatMessage, ChatPageContext } from "@/types/chat";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";

/**
 * Chat shell: streams assistant tokens from POST /api/chat-stream (plain text stream).
 * Manages localStorage sessions, sidebar, and dynamic empty state.
 */
export const ChatWrapper = ({
  pageContext,
  initialMessages,
}: {
  pageContext: ChatPageContext;
  initialMessages: ChatMessage[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeChatId, setActiveChatId] = useState<string | undefined>(pageContext.chatId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingLength, setStreamingLength] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarEpoch, setSidebarEpoch] = useState(0);
  const rafRef = useRef<number | null>(null);
  const pendingContentRef = useRef<string | null>(null);
  const syncedRef = useRef(false);

  const [liveCrawl, setLiveCrawl] = useState<LiveCrawlPoll | null>(null);
  const [forceCrawlPoll, setForceCrawlPoll] = useState(false);
  const [recrawlLoading, setRecrawlLoading] = useState(false);
  const crawlTerminalRef = useRef(false);
  const pollErrorNotifiedRef = useRef(false);

  const effectiveContext = useMemo((): ChatPageContext => {
    const baseContext =
      forceCrawlPoll && pageContext.crawlStatus !== "running"
        ? {
            ...pageContext,
            indexed: false,
            crawlStatus: "running" as const,
            crawlJobPhase: "pending" as CrawlJobPhase,
            crawledPageCount: 0,
            discoveredPageCount: 0,
            indexedPages: [],
            recentPages: [],
            ingestedCharCount: undefined,
            ingestError: undefined,
          }
        : pageContext;

    if (!liveCrawl || baseContext.crawlStatus !== "running") return baseContext;

    return mergeLiveCrawlContext(baseContext, liveCrawl, {
      preferLiveCounts: forceCrawlPoll,
    });
  }, [pageContext, liveCrawl, forceCrawlPoll]);

  useEffect(() => {
    clearChatNavActive();
    if (effectiveContext.crawlStatus === "running") {
      return;
    }
    if (effectiveContext.ingestError) {
      failIngestChatNavToast(effectiveContext.ingestError);
    } else if (effectiveContext.indexed) {
      completeChatNavToast();
    }
  }, [effectiveContext.ingestError, effectiveContext.indexed, effectiveContext.crawlStatus]);

  useEffect(() => {
    if (pageContext.crawlStatus !== "running" && !forceCrawlPoll) return;

    crawlTerminalRef.current = false;
    pollErrorNotifiedRef.current = false;
    let cancelled = false;
    let intervalId: number | null = null;

    const stopPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const notifyPollFailure = (status: number, error?: string) => {
      if (pollErrorNotifiedRef.current) return;
      pollErrorNotifiedRef.current = true;
      const failure = crawlStatusPollFailure(status, error);
      toast.error(failure.title, { description: failure.subtitle });
      if (failure.stopPolling) {
        stopPolling();
        setForceCrawlPoll(false);
      }
    };

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/crawl/status?siteRootKey=${encodeURIComponent(pageContext.siteRootKey)}`
        );
        if (cancelled) return;

        if (!res.ok) {
          let errorMessage: string | undefined;
          try {
            const body = (await res.json()) as { error?: string };
            errorMessage = body.error;
          } catch {
            /* ignore parse errors */
          }
          notifyPollFailure(res.status, errorMessage);
          return;
        }

        const data = (await res.json()) as {
          status: CrawlJobPhase | "idle";
          crawled?: number;
          indexed?: number;
          discovered?: number;
          recentPages?: string[];
          indexedPages?: string[];
          currentPath?: string;
          phaseDetail?: string;
        };

        setLiveCrawl({
          status: data.status,
          crawled: data.crawled ?? 0,
          discovered: data.discovered ?? 0,
          indexed: data.indexed ?? 0,
          recentPages: data.recentPages ?? [],
          indexedPages: data.indexedPages ?? [],
          currentPath: data.currentPath,
          phaseDetail: data.phaseDetail,
        });

        if (data.status === "completed" || data.status === "failed") {
          if (!crawlTerminalRef.current) {
            crawlTerminalRef.current = true;
            setForceCrawlPoll(false);
            stopPolling();
            router.refresh();
          }
        }
      } catch {
        /* retry on next interval */
      }
    };

    void poll();
    intervalId = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [pageContext.crawlStatus, pageContext.siteRootKey, router, forceCrawlPoll]);

  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;

    const hasServerHistory = (initialMessages ?? []).length > 0;
    const chatId = ensureSessionForUrl(
      pageContext.canonicalKey,
      pageContext.httpsUrl,
      pageContext.chatId,
      hasServerHistory
    );
    setActiveChatId(chatId);
    setSidebarEpoch((n) => n + 1);

    if (isLegacyChatId(chatId)) {
      if (searchParams.get("chat")) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("chat");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      }
      return;
    }

    if (searchParams.get("chat") !== chatId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("chat", chatId);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [
    initialMessages,
    pageContext.canonicalKey,
    pageContext.httpsUrl,
    pageContext.chatId,
    pathname,
    router,
    searchParams,
  ]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const flushStreamUpdate = useCallback((assistantId: string) => {
    const snapshot = pendingContentRef.current;
    if (snapshot === null) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot } : m))
    );
    setStreamingLength(snapshot.length);
    pendingContentRef.current = null;
  }, []);

  const scheduleStreamUpdate = useCallback(
    (assistantId: string, content: string) => {
      pendingContentRef.current = content;
      if (rafRef.current !== null) return;

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        flushStreamUpdate(assistantId);
      });
    },
    [flushStreamUpdate]
  );

  const apiChatId = activeChatId && !isLegacyChatId(activeChatId) ? activeChatId : undefined;

  const isCrawling = effectiveContext.crawlStatus === "running";

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading || isCrawling) return;

    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: now,
    };
    const assistantId = crypto.randomUUID();
    const nextMessages = [...messages, userMessage];

    if (activeChatId) {
      const isFirstUserMessage = !messages.some((m) => m.role === "user");
      if (isFirstUserMessage && !isLegacyChatId(activeChatId)) {
        upsertSession({
          chatId: activeChatId,
          canonicalKey: pageContext.canonicalKey,
          httpsUrl: pageContext.httpsUrl,
          title: titleFromFirstMessage(text),
        });
        setSidebarEpoch((n) => n + 1);
      } else {
        touchSession(activeChatId);
        setSidebarEpoch((n) => n + 1);
      }
    }

    setInput("");
    setIsLoading(true);
    setStreamingLength(0);
    setMessages([
      ...nextMessages,
      { id: assistantId, role: "assistant", content: "", createdAt: now },
    ]);

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          canonicalUrl: pageContext.canonicalKey,
          ...(apiChatId ? { chatId: apiChatId } : {}),
        }),
      });

      if (!res.ok || !res.body) {
        const { title, subtitle } = await parseChatErrorResponse(res);
        toast.error(title, { description: subtitle });
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        scheduleStreamUpdate(assistantId, assistantContent);
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
      );
      setStreamingLength(assistantContent.length);
      if (activeChatId) {
        touchSession(activeChatId);
        setSidebarEpoch((n) => n + 1);
      }
    } catch {
      toast.error("Connection failed", {
        description: "Could not reach the chat service. Check your network and try again.",
      });
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
  };

  const handleRecrawl = useCallback(async () => {
    setRecrawlLoading(true);
    try {
      const res = await fetch("/api/crawl/recrawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalUrl: pageContext.httpsUrl }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        title?: string;
        subtitle?: string;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.title ?? "Re-crawl failed", {
          description: data.subtitle ?? data.error ?? "Could not start re-crawl.",
        });
        return;
      }
      setForceCrawlPoll(true);
      setLiveCrawl({
        status: "pending",
        crawled: 0,
        discovered: 0,
        indexed: 0,
        recentPages: [],
        indexedPages: [],
      });
      toast.success("Re-crawling site…", {
        description: "Your chat messages stay in this session.",
      });
      router.refresh();
    } catch {
      toast.error("Re-crawl failed", {
        description: "Could not reach the crawl service. Try again shortly.",
      });
    } finally {
      setRecrawlLoading(false);
    }
  }, [pageContext.httpsUrl, router]);

  const composerBusy = isLoading || isCrawling;

  return (
    <ChatShell
      pageContext={effectiveContext}
      activeChatId={activeChatId}
      mobileSidebarOpen={mobileSidebarOpen}
      onMobileSidebarOpenChange={setMobileSidebarOpen}
      input={input}
      isLoading={composerBusy}
      showComposerChips={messages.length === 0 && !isCrawling}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      onPromptSelect={handlePromptSelect}
      onSessionsChange={() => setSidebarEpoch((n) => n + 1)}
      refreshToken={sidebarEpoch}
      onRecrawl={handleRecrawl}
      recrawlLoading={recrawlLoading}
      messages={
        <Messages
          messages={messages}
          pageContext={effectiveContext}
          isLoading={composerBusy}
          streamingContentLength={streamingLength}
        />
      }
    />
  );
};
