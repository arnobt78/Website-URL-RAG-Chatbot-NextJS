"use client";

import {
  CHAT_NAV_COMPLETE_STEP,
  CHAT_NAV_INGEST_FAIL_STEP,
  CHAT_NAV_SESSION_KEY,
  CHAT_NAV_STEP_MS,
  CHAT_NAV_TOAST_ID,
  formatPhaseStep,
  type ChatNavPhase,
  type ChatNavStep,
} from "@/lib/chat-navigation-status";
import { toast } from "sonner";

export function showChatNavStep(step: ChatNavStep) {
  toast.loading(step.title, {
    id: CHAT_NAV_TOAST_ID,
    description: step.subtitle,
  });
}

export function startChatNavTicker(
  steps: ChatNavStep[],
  phase: ChatNavPhase,
  onStep?: (step: ChatNavStep) => void
): () => void {
  let index = 0;

  const tick = () => {
    const raw = steps[index % steps.length];
    const formatted = formatPhaseStep(phase, raw);
    showChatNavStep(formatted);
    onStep?.(formatted);
    index += 1;
  };

  tick();
  const intervalId = window.setInterval(tick, CHAT_NAV_STEP_MS);

  return () => {
    window.clearInterval(intervalId);
  };
}

export function completeChatNavToast() {
  const step = formatPhaseStep("complete", CHAT_NAV_COMPLETE_STEP);
  toast.success(step.title, {
    id: CHAT_NAV_TOAST_ID,
    description: step.subtitle,
  });
}

export function failChatNavToast(title: string, subtitle: string) {
  toast.error(title, {
    id: CHAT_NAV_TOAST_ID,
    description: subtitle,
  });
}

export function failIngestChatNavToast(detail: string) {
  const step = formatPhaseStep("complete", {
    ...CHAT_NAV_INGEST_FAIL_STEP,
    subtitle: detail,
  });
  toast.error(step.title, {
    id: CHAT_NAV_TOAST_ID,
    description: step.subtitle,
  });
}

export function dismissChatNavToast() {
  toast.dismiss(CHAT_NAV_TOAST_ID);
}

export function markChatNavActive() {
  try {
    sessionStorage.setItem(CHAT_NAV_SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable
  }
}

export function clearChatNavActive() {
  try {
    sessionStorage.removeItem(CHAT_NAV_SESSION_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

export function isChatNavActive(): boolean {
  try {
    return sessionStorage.getItem(CHAT_NAV_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
