"use client";

import { Button, Textarea } from "@nextui-org/react";
import { Send } from "lucide-react";
import { canSubmitChatInput } from "@/lib/chat-input-utils";
import type { ChangeEvent, FormEvent } from "react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e?: FormEvent) => void | Promise<void>;
  setInput: (value: string) => void;
  isLoading?: boolean;
}

/** Bottom-fixed chat input — Enter submits, Shift+Enter adds newline. */
export const ChatInput = ({
  handleInputChange,
  handleSubmit,
  input,
  setInput,
  isLoading = false,
}: ChatInputProps) => {
  return (
    <div className="z-10 bg-zinc-800 absolute bottom-0 left-0 w-full border-t border-zinc-700/50">
      <div className="mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-3xl xl:max-w-3xl">
        <div className="relative flex w-full flex-1 py-3">
          <form
            onSubmit={handleSubmit}
            className="flex w-full items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2"
          >
            <Textarea
              minRows={1}
              maxRows={4}
              autoFocus
              disabled={isLoading}
              onChange={handleInputChange}
              value={input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!canSubmitChatInput(isLoading, input)) return;
                  void handleSubmit();
                  setInput("");
                }
              }}
              placeholder="Enter your question..."
              classNames={{
                inputWrapper: "bg-transparent shadow-none border-none p-0 min-h-0",
                input: "text-base text-zinc-100 placeholder:text-zinc-500",
              }}
              className="flex-1 resize-none bg-transparent"
            />

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
          </form>
        </div>
      </div>
    </div>
  );
};
