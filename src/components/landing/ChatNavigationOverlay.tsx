"use client";

import { INGEST_INDEX_TIP } from "@/lib/ingest-user-messages";
import { formatPhaseStep, CHAT_NAV_VALIDATE_STEPS, type ChatNavStep } from "@/lib/chat-navigation-status";

type ChatNavigationOverlayProps = {
  visible: boolean;
  step: ChatNavStep | null;
};

const defaultStep = formatPhaseStep("validate", CHAT_NAV_VALIDATE_STEPS[0]);

export function ChatNavigationOverlay({ visible, step }: ChatNavigationOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-4 flex max-w-md flex-col items-center text-center">
        <div
          className="size-12 animate-spin rounded-full border-[3px] border-zinc-700 border-t-sky-500"
          aria-hidden="true"
        />
        <p className="mt-6 text-lg font-semibold">{step?.title ?? defaultStep.title}</p>
        <p className="mt-2 text-sm text-zinc-400">{step?.subtitle ?? defaultStep.subtitle}</p>
        <p className="mt-4 max-w-sm text-xs leading-relaxed text-zinc-500">{INGEST_INDEX_TIP}</p>
      </div>
    </div>
  );
}
