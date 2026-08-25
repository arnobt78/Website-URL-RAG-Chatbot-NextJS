"use client";

import { CHAT_PROMPT_CHIPS } from "@/lib/chat-prompt-chips";
import { Sparkles } from "lucide-react";

type PromptChipsProps = {
  onSelect: (prompt: string) => void;
  className?: string;
};

export function PromptChips({ onSelect, className }: PromptChipsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <Sparkles className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
      {CHAT_PROMPT_CHIPS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-sky-700 hover:bg-zinc-800 hover:text-white"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
