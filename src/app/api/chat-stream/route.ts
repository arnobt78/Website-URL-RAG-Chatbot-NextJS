import { chatWithFallback } from "@/lib/ai/fallback-rag-chat";
import { siteRootKeyFromCanonical } from "@/lib/crawl/site-root";
import { flushLangfuse, getLangfuse, truncateForTrace } from "@/lib/langfuse";
import { allowChatRequest } from "@/lib/rate-limit";
import {
  buildSessionId,
  parseUserUrlInput,
  urlToNamespace,
} from "@/lib/url-security";
import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const chatBodySchema = z.object({
  canonicalUrl: z.string().min(1).max(2048),
  chatId: z.string().uuid().optional(),
  messages: z
    .array(
      z
        .object({
          content: z.string().min(1).max(4000),
        })
        .passthrough()
    )
    .min(1)
    .max(100),
});

function jsonError(
  status: number,
  title: string,
  subtitle: string,
  error?: string
) {
  return NextResponse.json(
    {
      error: error ?? subtitle,
      code: status,
      title,
      subtitle,
    },
    { status }
  );
}

function scheduleLangfuseFlush(): void {
  after(() => {
    void flushLangfuse();
  });
}

export const POST = async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const allowed = await allowChatRequest(ip);
  if (!allowed) {
    // Expected soft limit — do not create Langfuse/Sentry noise
    return jsonError(
      429,
      "Too many requests",
      "You have sent too many messages. Please wait a minute and try again.",
      "Too many requests. Please try again shortly."
    );
  }

  const cookieSessionId = req.cookies.get("sessionId")?.value;
  if (!cookieSessionId) {
    return jsonError(
      403,
      "Session required",
      "A valid session cookie is required to chat."
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError(400, "Invalid request", "The request body is not valid JSON.");
  }

  const parsed = chatBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(400, "Invalid request", "Message format or length is invalid.");
  }

  const { messages, canonicalUrl, chatId } = parsed.data;

  const urlResult = await parseUserUrlInput(canonicalUrl);
  if (!urlResult.ok) {
    return jsonError(403, "URL not allowed", urlResult.reason);
  }

  const sessionId = buildSessionId(urlResult.canonicalKey, cookieSessionId, chatId);
  const siteRootKey = siteRootKeyFromCanonical(urlResult.canonicalKey);
  const namespace = urlToNamespace(siteRootKey);
  const lastMessage = messages[messages.length - 1].content;
  const inputPreview = truncateForTrace(lastMessage);

  const langfuse = getLangfuse();
  const trace = langfuse?.trace({
    name: "chat-response",
    sessionId,
    input: inputPreview,
    tags: ["chat"],
    metadata: {
      siteRootKey,
      namespace,
      hasChatId: Boolean(chatId),
    },
  });

  const result = await chatWithFallback(lastMessage, {
    streaming: true,
    sessionId,
    namespace,
  });

  if (!result.ok) {
    const isExpectedClientFailure = result.status < 500;
    if (isExpectedClientFailure) {
      trace?.update({
        output: { skipped: true, status: result.status, kind: result.kind },
      });
    } else {
      trace?.update({
        output: { error: result.subtitle },
        metadata: { kind: result.kind, provider: result.provider, model: result.model },
      });
      trace?.event({
        name: "chat-failure",
        level: "ERROR",
        statusMessage: result.subtitle,
        metadata: { kind: result.kind, status: result.status },
      });
    }
    scheduleLangfuseFlush();
    return jsonError(result.status, result.title, result.subtitle, result.subtitle);
  }

  const generation = trace?.generation({
    name: "llm-chat",
    model: result.model,
    input: inputPreview,
    metadata: { provider: result.provider },
  });

  const stream = result.response.output as
    | ReadableStream<string>
    | ReadableStream<Uint8Array>;

  const decoder = new TextDecoder();
  let collected = "";

  const byteStream = stream.pipeThrough(
    new TransformStream<string | Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (typeof chunk === "string") {
          collected += chunk;
          controller.enqueue(new TextEncoder().encode(chunk));
        } else {
          collected += decoder.decode(chunk, { stream: true });
          controller.enqueue(chunk);
        }
      },
      flush() {
        collected += decoder.decode();
        const outputPreview = truncateForTrace(collected, 8000);
        generation?.end({ output: outputPreview });
        trace?.update({ output: outputPreview });
      },
    })
  );

  scheduleLangfuseFlush();

  return new Response(byteStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-LLM-Provider": result.provider,
      "X-LLM-Model": result.model,
    },
  });
};
