"use client";

import { cn } from "@/lib/utils";
import { Bot, Check, Copy, User } from "lucide-react";
import { useCallback, useState } from "react";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface MessageProps {
  content: string;
  isUserMessage: boolean;
  createdAt?: string;
  isThinking?: boolean;
}

function formatMessageTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Single chat bubble — user vs assistant styling with avatar, timestamp, and copy. */
export const Message = ({
  content,
  isUserMessage,
  createdAt,
  isThinking = false,
}: MessageProps) => {
  const [copied, setCopied] = useState(false);
  const displayTime = formatMessageTime(createdAt);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied — silent fail
    }
  }, [content]);

  return (
    <div
      className={cn({
        "bg-zinc-800": isUserMessage,
        "bg-zinc-900/25": !isUserMessage,
      })}
    >
      <div className="p-6 pb-4">
        <div className="max-w-3xl mx-auto flex items-start gap-2.5">
          <div
            className={cn(
              "size-10 shrink-0 aspect-square rounded-full border border-zinc-700 bg-zinc-900 flex justify-center items-center",
              {
                "bg-blue-950 border-blue-700 text-zinc-200": isUserMessage,
              }
            )}
          >
            {isUserMessage ? <User className="size-5" /> : <Bot className="size-5 text-white" />}
          </div>

          <div className="flex flex-col ml-6 w-full min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {isUserMessage ? "You" : "Website"}
              </span>
            </div>

            {isThinking ? (
              <ThinkingIndicator />
            ) : (
              <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white text-justify whitespace-pre-wrap break-words">
                {content}
              </p>
            )}
          </div>
        </div>
      </div>

      {(displayTime || content) && !isThinking && (
        <div className="max-w-3xl mx-auto px-6 pb-4 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{displayTime}</span>
          {content ? (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
              aria-label={copied ? "Copied" : "Copy message"}
            >
              {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            </button>
          ) : (
            <span className="size-8" />
          )}
        </div>
      )}
    </div>
  );
};
