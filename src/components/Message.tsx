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

/** Single chat bubble — user right-aligned, assistant left-aligned (~85% width). */
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
      className={cn(
        "flex w-full py-2",
        isUserMessage ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] gap-2",
          isUserMessage ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border",
            isUserMessage
              ? "border-sky-700 bg-sky-950 text-sky-200"
              : "border-zinc-600 bg-zinc-800 text-zinc-200"
          )}
        >
          {isUserMessage ? <User className="size-4" /> : <Bot className="size-4" />}
        </div>

        <div className={cn("min-w-0", isUserMessage ? "items-end" : "items-start")}>
          <div
            className={cn(
              "rounded-2xl px-4 py-3",
              isUserMessage
                ? "bg-gradient-to-br from-sky-600 to-blue-700 text-white"
                : "border border-zinc-700 bg-zinc-800/90 text-zinc-100"
            )}
          >
            {isThinking ? (
              <ThinkingIndicator />
            ) : (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</p>
            )}
          </div>

          {!isThinking && (displayTime || content) ? (
            <div
              className={cn(
                "mt-1 flex items-center gap-2 px-1",
                isUserMessage ? "justify-end" : "justify-start"
              )}
            >
              {displayTime ? (
                <span className="text-xs text-zinc-500">{displayTime}</span>
              ) : null}
              {content ? (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex size-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  aria-label={copied ? "Copied" : "Copy message"}
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-400" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
