"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Messages } from "./Messages";
import { ChatInput } from "./ChatInput";
import { parseChatErrorResponse } from "@/lib/chat-errors";
import {
  clearChatNavActive,
  completeChatNavToast,
  failIngestChatNavToast,
} from "@/lib/chat-navigation-ticker";
import type { ChatMessage } from "@/types/chat";

/**
 * Chat shell: streams assistant tokens from POST /api/chat-stream (plain text stream).
 * Shows Sonner toasts on HTTP errors; auto-scrolls and displays Thinking state.
 */
export const ChatWrapper = ({
  canonicalKey,
  initialMessages,
  ingestError,
}: {
  canonicalKey: string;
  initialMessages: ChatMessage[];
  ingestError?: string;
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingLength, setStreamingLength] = useState(0);
  const rafRef = useRef<number | null>(null);
  const pendingContentRef = useRef<string | null>(null);

  useEffect(() => {
    clearChatNavActive();
    if (ingestError) {
      failIngestChatNavToast(ingestError);
    } else {
      completeChatNavToast();
    }
  }, [ingestError]);

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
        body: JSON.stringify({ messages: nextMessages, canonicalUrl: canonicalKey }),
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

  return (
    <div className="relative min-h-full bg-zinc-900 flex divide-y divide-zinc-700 flex-col justify-between gap-2">
      <div className="flex-1 text-black bg-zinc-800 justify-between flex flex-col">
        <Messages
          messages={messages}
          isLoading={isLoading}
          streamingContentLength={streamingLength}
        />
      </div>

      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        setInput={setInput}
        isLoading={isLoading}
      />
    </div>
  );
};
