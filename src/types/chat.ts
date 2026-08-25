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
