import { recrawlSite } from "@/lib/crawl/invalidate-and-recrawl";
import { siteRootKeyFromCanonical } from "@/lib/crawl/site-root";
import { parseUserUrlInput, urlToNamespace } from "@/lib/url-security";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/** Accepts full https URL or host+path canonical key (same as chat-stream). */
const recrawlBodySchema = z.object({
  canonicalUrl: z.string().min(1).max(2048),
});

function jsonError(status: number, title: string, subtitle: string) {
  return NextResponse.json(
    { ok: false, error: subtitle, title, subtitle },
    { status }
  );
}

function clientIpFromRequest(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
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

  const parsed = recrawlBodySchema.safeParse(json);
  if (!parsed.success) {
    return jsonError(400, "Invalid request", "Request format is invalid.");
  }

  const urlResult = await parseUserUrlInput(parsed.data.canonicalUrl);
  if (!urlResult.ok) {
    return jsonError(403, "URL not allowed", urlResult.reason);
  }

  const siteRootKey = siteRootKeyFromCanonical(urlResult.canonicalKey);
  const namespace = urlToNamespace(siteRootKey);

  const result = await recrawlSite({

    siteRootKey,
    namespace,
    clientIp: clientIpFromRequest(req),
  });

  if (!result.ok) {
    const status = result.ingestError.includes("Too many") ? 429 : 503;
    return jsonError(status, "Re-crawl failed", result.ingestError);
  }

  return NextResponse.json({
    ok: true,
    crawlStatus: "running",
    crawlJobPhase: result.job.status,
  });
}
