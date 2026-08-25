"use client";

import {
  clearChatNavActive,
  isChatNavActive,
  startChatNavTicker,
} from "@/lib/chat-navigation-ticker";
import { CHAT_NAV_INDEX_STEPS, formatPhaseStep, type ChatNavStep } from "@/lib/chat-navigation-status";
import { useEffect, useRef, useState } from "react";

/** Full-screen loader shown while SSR ingest runs on /[...url]. */
export function ChatRouteLoader() {
  const stopTickerRef = useRef<(() => void) | null>(null);
  const [step, setStep] = useState<ChatNavStep | null>(null);

  useEffect(() => {
    const fromLanding = isChatNavActive();

    stopTickerRef.current = startChatNavTicker(CHAT_NAV_INDEX_STEPS, "index", (nextStep) => {
      setStep(nextStep);
    });

    if (!fromLanding) {
      clearChatNavActive();
    }

    return () => {
      stopTickerRef.current?.();
      stopTickerRef.current = null;
    };
  }, []);

  const fallback = formatPhaseStep("index", CHAT_NAV_INDEX_STEPS[0]);

  return (
    <div
      className="flex h-screen flex-col items-center justify-center bg-zinc-900 text-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="size-12 animate-spin rounded-full border-[3px] border-zinc-700 border-t-sky-500"
        aria-hidden="true"
      />
      <p className="mt-6 text-lg font-semibold">{step?.title ?? fallback.title}</p>
      <p className="mt-2 text-sm text-zinc-400">{step?.subtitle ?? fallback.subtitle}</p>
    </div>
  );
}
