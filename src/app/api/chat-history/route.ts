import { runWithRagChatFallback } from "@/lib/ai/fallback-rag-chat";
import { buildSessionId, parseUserUrlInput } from "@/lib/url-security";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const deleteBodySchema = z.object({
  canonicalUrl: z.string().min(1).max(2048),
  chatId: z.string().uuid().optional(),
});

function jsonError(status: number, title: string, subtitle: string) {
  return NextResponse.json(
    { error: subtitle, code: status, title, subtitle },
    { status }
  );
}

export const DELETE = async (req: NextRequest) => {
  const cookieSessionId = req.cookies.get("sessionId")?.value;
  if (!cookieSessionId) {
    return jsonError(403, "Session required", "A valid session cookie is required.");
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonError(400, "Invalid request", "The request body is not valid JSON.");
  }

  const parsed = deleteBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(400, "Invalid request", "Request format is invalid.");
  }

  const { canonicalUrl, chatId } = parsed.data;
  const urlResult = await parseUserUrlInput(canonicalUrl);
  if (!urlResult.ok) {
    return jsonError(403, "URL not allowed", urlResult.reason);
  }

  const sessionId = buildSessionId(urlResult.canonicalKey, cookieSessionId, chatId);
  const result = await runWithRagChatFallback((client) =>
    client.history.deleteMessages({ sessionId })
  );

  if (!result.ok) {
    return jsonError(result.status, result.title, result.subtitle);
  }

  return NextResponse.json({ ok: true });
};
