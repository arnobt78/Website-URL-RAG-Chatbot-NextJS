import { chatWithFallback } from "@/lib/ai/fallback-rag-chat";
import { allowChatRequest } from "@/lib/rate-limit";
import {
  buildSessionId,
  parseUserUrlInput,
  urlToNamespace,
} from "@/lib/url-security";
import { NextRequest, NextResponse } from "next/server";
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

export const POST = async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const allowed = await allowChatRequest(ip);
  if (!allowed) {
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
  const namespace = urlToNamespace(urlResult.canonicalKey);
  const lastMessage = messages[messages.length - 1].content;

  const result = await chatWithFallback(lastMessage, {
    streaming: true,
    sessionId,
    namespace,
  });

  if (!result.ok) {
    return jsonError(result.status, result.title, result.subtitle, result.subtitle);
  }

  const stream = result.response.output as
    | ReadableStream<string>
    | ReadableStream<Uint8Array>;

  const byteStream = stream.pipeThrough(
    new TransformStream<string | Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (typeof chunk === "string") {
          controller.enqueue(new TextEncoder().encode(chunk));
        } else {
          controller.enqueue(chunk);
        }
      },
    })
  );

  return new Response(byteStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-LLM-Provider": result.provider,
      "X-LLM-Model": result.model,
    },
  });
};
