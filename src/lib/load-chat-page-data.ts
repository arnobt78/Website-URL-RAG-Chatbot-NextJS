import "server-only";

import { runWithRagChatFallback } from "@/lib/ai/fallback-rag-chat";
import { fetchPageContentAsText } from "@/lib/fetch-page-content";
import { indexRedisKey } from "@/lib/ingest-constants";
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
  ingestedCharCount?: number;
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

  const pageContent = await fetchPageContentAsText(httpsUrl);
  if (!pageContent.ok) {
    return {
      initialMessages,
      indexed: false,
      ingestError: pageContent.reason,
    };
  }

  const ingestResult = await runWithRagChatFallback((client) =>
    client.context.add({
      type: "text",
      data: pageContent.text,
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

  const saveResult = ingestResult.result as { success?: boolean; ids?: string[] };
  if (saveResult.success === false || !saveResult.ids?.length) {
    return {
      initialMessages,
      indexed: false,
      ingestError: "Indexing produced no searchable content. Try a different page.",
    };
  }

  await redis.sadd("indexed-urls", indexRedisKey(canonicalKey));

  return { initialMessages, indexed: true, ingestedCharCount: pageContent.text.length };
}
