"use client";

import { Button, Textarea } from "@nextui-org/react";
import { Send } from "lucide-react";
import { canSubmitChatInput } from "@/lib/chat-input-utils";
import { CHAT_CONTENT_GUTTER } from "@/lib/chat-layout";
import type { ChangeEvent, FormEvent } from "react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e?: FormEvent) => void | Promise<void>;
  isLoading?: boolean;
}

/** Bottom chat composer — taller textarea, bottom-aligned placeholder. */
export const ChatInput = ({
  handleInputChange,
  handleSubmit,
  input,
  isLoading = false,
}: ChatInputProps) => {
  const nearLimit = input.length > 3600;

  return (
    <div className={`shrink-0 border-t border-zinc-800 bg-zinc-900/90 py-3 backdrop-blur ${CHAT_CONTENT_GUTTER}`}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-end gap-2 rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-3 sm:px-4"
      >
        <Textarea
          minRows={3}
          maxRows={8}
          autoFocus
          disabled={isLoading}
          onChange={handleInputChange}
          value={input}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!canSubmitChatInput(isLoading, input)) return;
              void handleSubmit();
            }
          }}
          placeholder="Enter your question..."
          classNames={{
            base: "flex-1",
            inputWrapper:
              "bg-transparent shadow-none border-none p-0 min-h-[4.5rem] items-end pb-0",
            input:
              "px-2 py-1 text-base leading-relaxed text-zinc-100 placeholder:text-zinc-500 placeholder:leading-relaxed align-bottom",
          }}
          className="flex-1 resize-none bg-transparent"
        />

        <div className="flex shrink-0 flex-col items-end gap-1 self-end pb-1">
          {nearLimit ? (
            <span className="text-[10px] text-amber-400">{input.length}/4000</span>
          ) : null}
          <Button
            size="sm"
            type="submit"
            isDisabled={!canSubmitChatInput(isLoading, input)}
            isIconOnly
            aria-label="Send message"
            className="shrink-0 border border-zinc-600 bg-zinc-800 text-zinc-100 min-w-9 h-9"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
