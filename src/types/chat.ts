/**
 * Local chat message shape (replaces `ai/react` Message to avoid vulnerable AI SDK majors).
 * Compatible with Upstash rag-chat history entries used by this app.
 */
export type ChatMessage = {
  id?: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  createdAt?: string;
};

/** SSR + client context for the active chat page. */
export type ChatPageContext = {
  httpsUrl: string;
  canonicalKey: string;
  indexed: boolean;
  ingestError?: string;
  ingestedCharCount?: number;
  chatId?: string;
};
