import { ChatWrapper } from "@/components/ChatWrapper";
import { loadChatPageData } from "@/lib/load-chat-page-data";
import { siteRootKeyFromCanonical } from "@/lib/crawl/site-root";
import { indexRedisKey } from "@/lib/ingest-constants";
import { redis } from "@/lib/redis";
import {
  buildSessionId,
  parseCatchAllSegments,
  urlToNamespace,
} from "@/lib/url-security";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{
    url: string | string[] | undefined;
  }>;
  searchParams: Promise<{
    chat?: string;
  }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clientIpFromHeaders(headerStore: Headers): string {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown"
  );
}

const Page = async ({ params, searchParams }: PageProps) => {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const headerStore = await headers();
  const sessionCookie = (await cookies()).get("sessionId")?.value;
  const headerSession = headerStore.get("x-session-id");

  const segments = Array.isArray(resolvedParams.url)
    ? resolvedParams.url
    : resolvedParams.url
      ? [resolvedParams.url]
      : [];

  const parsed = await parseCatchAllSegments(segments);
  if (!parsed.ok) {
    notFound();
  }

  const { httpsUrl, canonicalKey } = parsed;
  const siteRootKey = siteRootKeyFromCanonical(canonicalKey);
  const namespace = urlToNamespace(siteRootKey);

  const chatParam = resolvedSearch.chat?.trim();
  const chatId = chatParam && UUID_RE.test(chatParam) ? chatParam : undefined;

  const sessionPart = headerSession ?? sessionCookie ?? crypto.randomUUID();
  const sessionId = buildSessionId(canonicalKey, sessionPart, chatId);

  const isSiteAlreadyIndexed = await redis.sismember(
    "indexed-urls",
    indexRedisKey(siteRootKey)
  );

  const {
    initialMessages,
    indexed,
    ingestError,
    ingestedCharCount,
    crawlStatus,
    crawlJobPhase,
    crawledPageCount,
    discoveredPageCount,
    recentPages,
    indexedPages,
    currentPath,
    phaseDetail,
  } = await loadChatPageData({
    sessionId,
    httpsUrl,
    canonicalKey,
    siteRootKey,
    namespace,
    isSiteAlreadyIndexed: Boolean(isSiteAlreadyIndexed),
    clientIp: clientIpFromHeaders(headerStore),
  });

  return (
    <Suspense fallback={null}>
      <ChatWrapper
        key={chatId ?? `default-${canonicalKey}`}
        pageContext={{
          httpsUrl,
          canonicalKey,
          siteRootKey,
          indexed,
          ingestError,
          ingestedCharCount,
          chatId,
          crawlStatus,
          crawlJobPhase,
          crawledPageCount,
          discoveredPageCount,
          recentPages,
          indexedPages,
          currentPath,
          phaseDetail,
        }}
        initialMessages={initialMessages}
      />
    </Suspense>
  );
};

export default Page;
