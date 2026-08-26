"use client";

import { HERO_TRUST_MESSAGES } from "@/lib/landing-copy";
import { easeOut } from "@/lib/motion";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";

const ROTATE_MS = 4000;

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Single rotating trust pill below the site badge — crossfade + slide with ease-out.
 */
export function HeroTrustRotator() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );

  useEffect(() => {
    if (reduceMotion) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_TRUST_MESSAGES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const message = HERO_TRUST_MESSAGES[index];
  const Icon = message.icon;

  return (
    <div className="mb-4 flex min-h-[2.25rem] items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: easeOut }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-200 backdrop-blur-sm"
        >
          <Icon className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>
            <span className="font-medium text-emerald-100">{message.highlight}</span>{" "}
            <span className="text-emerald-300/90">{message.rest}</span>
          </span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
