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
import type { ChatMessage, ChatPageContext } from "@/types/chat";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
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

  useEffect(() => {
    clearChatNavActive();
    if (pageContext.ingestError) {
      failIngestChatNavToast(pageContext.ingestError);
    } else {
      completeChatNavToast();
    }
  }, [pageContext.ingestError]);

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

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

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

  return (
    <ChatShell
      pageContext={pageContext}
      activeChatId={activeChatId}
      mobileSidebarOpen={mobileSidebarOpen}
      onMobileSidebarOpenChange={setMobileSidebarOpen}
      input={input}
      isLoading={isLoading}
      showComposerChips={messages.length === 0}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      onPromptSelect={handlePromptSelect}
      onSessionsChange={() => setSidebarEpoch((n) => n + 1)}
      refreshToken={sidebarEpoch}
      messages={
        <Messages
          messages={messages}
          pageContext={pageContext}
          isLoading={isLoading}
          streamingContentLength={streamingLength}
        />
      }
    />
  );
};
