import type { ChatOptions } from "@upstash/rag-chat";

/** Streaming chat result from rag-chat (output stream + metadata). */
export type RagChatResponse = {
  output: ReadableStream<string> | ReadableStream<Uint8Array> | string;
};

export type ChatErrorKind =
  | "not_configured"
  | "billing"
  | "rate_limit"
  | "auth"
  | "upstream"
  | "client"
  | "unknown";

export type ProviderKind = "gemini" | "groq" | "openrouter" | "huggingface" | "openai";

export type ProviderConfig = {
  id: ProviderKind;
  label: string;
  envKey: string;
  models: string[];
};

export type ClassifiedError = {
  kind: ChatErrorKind;
  status?: number;
  message: string;
  retriable: boolean;
  skipProvider: boolean;
};

export type ChatStreamSuccess = {
  ok: true;
  response: RagChatResponse;
  provider: string;
  model: string;
};

export type ChatStreamFailure = {
  ok: false;
  kind: ChatErrorKind;
  status: number;
  title: string;
  subtitle: string;
  provider?: string;
  model?: string;
};

export type ChatWithFallbackOptions = ChatOptions & {
  sessionId: string;
  namespace: string;
};
