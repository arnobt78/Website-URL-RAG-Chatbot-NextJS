"use client";

import { validateChatUrl } from "@/app/actions/validate-chat-url";
import { CHAT_NAV_VALIDATE_STEPS, type ChatNavStep } from "@/lib/chat-navigation-status";
import {
  clearChatNavActive,
  failChatNavToast,
  markChatNavActive,
  startChatNavTicker,
} from "@/lib/chat-navigation-ticker";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export type ChatNavigationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function useChatNavigation() {
  const router = useRouter();
  const stopTickerRef = useRef<(() => void) | null>(null);
  const navigatedRef = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState<ChatNavStep | null>(null);

  const stopTicker = useCallback(() => {
    stopTickerRef.current?.();
    stopTickerRef.current = null;
  }, []);

  const cancelNavigation = useCallback(() => {
    navigatedRef.current = false;
    stopTicker();
    clearChatNavActive();
    setIsNavigating(false);
    setCurrentStep(null);
  }, [stopTicker]);

  useEffect(() => {
    return () => {
      if (!navigatedRef.current) {
        stopTicker();
      }
    };
  }, [stopTicker]);

  const startNavigation = useCallback(
    async (input: string): Promise<ChatNavigationResult> => {
      const trimmed = input.trim();
      if (!trimmed || isNavigating) {
        return { ok: false, reason: "Enter a URL to continue" };
      }

      navigatedRef.current = false;
      setIsNavigating(true);
      markChatNavActive();
      stopTicker();

      stopTickerRef.current = startChatNavTicker(
        CHAT_NAV_VALIDATE_STEPS,
        "validate",
        (step) => {
          setCurrentStep(step);
        }
      );

      try {
        const result = await validateChatUrl(trimmed);

        if (!result.ok) {
          stopTicker();
          clearChatNavActive();
          failChatNavToast("URL not allowed", result.reason);
          setIsNavigating(false);
          setCurrentStep(null);
          return { ok: false, reason: result.reason };
        }

        navigatedRef.current = true;
        stopTicker();
        router.push(result.routePath);
        return { ok: true };
      } catch {
        stopTicker();
        clearChatNavActive();
        failChatNavToast("Connection failed", "Could not validate URL. Try again.");
        setIsNavigating(false);
        setCurrentStep(null);
        return { ok: false, reason: "Could not validate URL. Try again." };
      }
    },
    [isNavigating, router, stopTicker]
  );

  return {
    isNavigating,
    currentStep,
    startNavigation,
    cancelNavigation,
  };
}
