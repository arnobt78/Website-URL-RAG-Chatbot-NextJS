"use client";

import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { CHAT_CONTENT_GUTTER } from "@/lib/chat-layout";
import type { ChatMessage, ChatPageContext } from "@/types/chat";
import { useEffect, useRef } from "react";
import { Message } from "./Message";

interface MessagesProps {
  messages: ChatMessage[];
  pageContext: ChatPageContext;
  isLoading?: boolean;
  streamingContentLength?: number;
}

/** Scrollable message list with dynamic empty state. */
export const Messages = ({
  messages,
  pageContext,
  isLoading = false,
  streamingContentLength = 0,
}: MessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

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
      className={`flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth ${CHAT_CONTENT_GUTTER}`}
    >
      {messages.length ? (
        <div className="w-full py-4">
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
        </div>
      ) : (
        <ChatEmptyState pageContext={pageContext} />
      )}
    </div>
  );
};
