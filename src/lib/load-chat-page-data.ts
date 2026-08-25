import { runWithRagChatFallback } from "@/lib/ai/fallback-rag-chat";
import { allowIngestRequest } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";
import type { ChatMessage } from "@/types/chat";

type LoadChatPageDataArgs = {
  sessionId: string;
  httpsUrl: string;
  canonicalKey: string;
  namespace: string;
  isAlreadyIndexed: boolean;
  clientIp: string;
};

export type LoadChatPageDataResult = {
  initialMessages: ChatMessage[];
  indexed: boolean;
  ingestError?: string;
};

/**
 * Loads chat history and indexes the URL when needed, using the full LLM provider fallback chain.
 */
export async function loadChatPageData({
  sessionId,
  httpsUrl,
  canonicalKey,
  namespace,
  isAlreadyIndexed,
  clientIp,
}: LoadChatPageDataArgs): Promise<LoadChatPageDataResult> {
  const historyResult = await runWithRagChatFallback((client) =>
    client.history.getMessages({
      amount: 10,
      sessionId,
    })
  );

  if (!historyResult.ok) {
    return {
      initialMessages: [],
      indexed: isAlreadyIndexed,
      ingestError: historyResult.subtitle,
    };
  }

  const initialMessages = historyResult.result as ChatMessage[];

  if (isAlreadyIndexed) {
    return { initialMessages, indexed: true };
  }

  const allowed = await allowIngestRequest(clientIp);
  if (!allowed) {
    return {
      initialMessages,
      indexed: false,
      ingestError: "Too many indexing requests. Please wait a minute and try again.",
    };
  }

  const ingestResult = await runWithRagChatFallback((client) =>
    client.context.add({
      type: "html",
      source: httpsUrl,
      config: { chunkOverlap: 50, chunkSize: 200 },
      options: { namespace },
    })
  );

  if (!ingestResult.ok) {
    return {
      initialMessages,
      indexed: false,
      ingestError: ingestResult.subtitle,
    };
  }

  await redis.sadd("indexed-urls", canonicalKey);

  return { initialMessages, indexed: true };
}
