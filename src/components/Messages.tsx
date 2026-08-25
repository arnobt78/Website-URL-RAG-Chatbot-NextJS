"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";
import { Message } from "./Message";
import { MessageSquare } from "lucide-react";

interface MessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  streamingContentLength?: number;
}

/** Scrollable message list with smooth auto-scroll to latest content. */
export const Messages = ({
  messages,
  isLoading = false,
  streamingContentLength = 0,
}: MessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isLoading, streamingContentLength]);

  const lastMessage = messages[messages.length - 1];
  const showThinking =
    isLoading &&
    lastMessage?.role === "assistant" &&
    !lastMessage.content.trim();

  return (
    <div
      ref={containerRef}
      className="flex max-h-[calc(100vh-3.5rem-7rem)] flex-1 flex-col overflow-y-auto scroll-smooth"
    >
      {messages.length ? (
        <>
          {messages.map((message, i) => {
            const isLast = i === messages.length - 1;
            const isThinking =
              isLast && message.role === "assistant" && showThinking;

            return (
              <Message
                key={message.id ?? i}
                content={message.content}
                isUserMessage={message.role === "user"}
                createdAt={message.createdAt}
                isThinking={isThinking}
              />
            );
          })}
          <div ref={bottomRef} className="h-px shrink-0" aria-hidden="true" />
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <MessageSquare className="size-8 text-blue-500" />
          <h3 className="font-semibold text-xl text-white">You are all set.</h3>
          <p className="text-zinc-500 text-sm">Ask your first question to get started.</p>
        </div>
      )}
    </div>
  );
};
