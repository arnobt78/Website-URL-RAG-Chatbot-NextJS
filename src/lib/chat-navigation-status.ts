export type ChatNavStep = {
  title: string;
  subtitle: string;
};

export type ChatNavPhase = "validate" | "index" | "complete";

export const CHAT_NAV_TOAST_ID = "chat-nav-pipeline";

export const CHAT_NAV_SESSION_KEY = "chat-nav-active";

export const CHAT_NAV_STEP_MS = 1200;

export const CHAT_NAV_VALIDATE_STEPS: ChatNavStep[] = [
  {
    title: "Validating URL…",
    subtitle: "Checking format and host",
  },
  {
    title: "Resolving DNS…",
    subtitle: "Ensuring public destination",
  },
];

export const CHAT_NAV_INDEX_STEPS: ChatNavStep[] = [
  {
    title: "Preparing page…",
    subtitle: "Opening chat route",
  },
  {
    title: "Indexing content…",
    subtitle: "Chunking and embedding for RAG",
  },
];

export const CHAT_NAV_COMPLETE_STEP: ChatNavStep = {
  title: "Ready to chat",
  subtitle: "Page indexed — ask anything about this site.",
};

export const CHAT_NAV_INGEST_FAIL_STEP: ChatNavStep = {
  title: "Indexing incomplete",
  subtitle: "Chat is available, but page content may be limited.",
};

export function formatPhaseStep(phase: ChatNavPhase, step: ChatNavStep): ChatNavStep {
  const n = phase === "validate" ? 1 : phase === "index" ? 2 : 3;
  return {
    title: `Step ${n} of 3 · ${step.title}`,
    subtitle: step.subtitle,
  };
}

export function phaseNumber(phase: ChatNavPhase): number {
  return phase === "validate" ? 1 : phase === "index" ? 2 : 3;
}
