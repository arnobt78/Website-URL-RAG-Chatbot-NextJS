import type { RAGChat } from "@upstash/rag-chat";
import { createDefaultRagChat } from "@/lib/ai/fallback-rag-chat";
import { redis } from "./redis";

export { redis };

let ragChatInstance: RAGChat | undefined;

/** Lazy singleton — avoids throwing at import when no LLM keys are set (e.g. CI build). */
export function getRagChat(): RAGChat {
  if (!ragChatInstance) {
    ragChatInstance = createDefaultRagChat();
  }
  return ragChatInstance;
}
