import { ChatWrapper } from "@/components/ChatWrapper";
import { loadChatPageData } from "@/lib/load-chat-page-data";
import { redis } from "@/lib/redis";
import {
  buildSessionId,
  parseCatchAllSegments,
  urlToNamespace,
} from "@/lib/url-security";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    url: string | string[] | undefined;
  }>;
}

function clientIpFromHeaders(headerStore: Headers): string {
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown"
  );
}

const Page = async ({ params }: PageProps) => {
  const resolvedParams = await params;
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
  const namespace = urlToNamespace(canonicalKey);

  const sessionPart = headerSession ?? sessionCookie ?? crypto.randomUUID();
  const sessionId = buildSessionId(canonicalKey, sessionPart);

  const isAlreadyIndexed = await redis.sismember("indexed-urls", canonicalKey);

  const { initialMessages, ingestError } = await loadChatPageData({
    sessionId,
    httpsUrl,
    canonicalKey,
    namespace,
    isAlreadyIndexed: Boolean(isAlreadyIndexed),
    clientIp: clientIpFromHeaders(headerStore),
  });

  return (
    <ChatWrapper
      canonicalKey={canonicalKey}
      initialMessages={initialMessages}
      ingestError={ingestError}
    />
  );
};

export default Page;
