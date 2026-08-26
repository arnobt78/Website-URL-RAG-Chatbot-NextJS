import type { LucideIcon } from "lucide-react";
import { Gift, Globe, HardDrive, Shield } from "lucide-react";

/** Rotating hero trust pills — accurate privacy/session copy. */
export type HeroTrustMessage = {
  icon: LucideIcon;
  highlight: string;
  rest: string;
};

export const HERO_TRUST_MESSAGES: HeroTrustMessage[] = [
  {
    icon: Gift,
    highlight: "100% free",
    rest: "— no account required",
  },
  {
    icon: Shield,
    highlight: "Anonymous session",
    rest: "— HttpOnly cookie, no signup",
  },
  {
    icon: HardDrive,
    highlight: "Chat list stays in this browser",
    rest: "— sidebar saved locally",
  },
  {
    icon: Globe,
    highlight: "Whole-site RAG",
    rest: "— paste one URL, crawl many pages",
  },
];
