import { getCrawlJob } from "@/lib/crawl/crawl-job-store";
import { CRAWL_USER_ERRORS } from "@/lib/crawl/crawl-errors";
import { isValidSiteRootKey } from "@/lib/crawl/site-root";
import { allowCrawlStatusPoll } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

function clientIpFromRequest(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  const cookieSessionId = request.cookies.get("sessionId")?.value;
  if (!cookieSessionId) {
    return NextResponse.json(
      { error: "Session required. A valid session cookie is required." },
      { status: 403 }
    );
  }

  const ip = clientIpFromRequest(request);
  if (!(await allowCrawlStatusPoll(ip))) {
    return NextResponse.json(
      { error: CRAWL_USER_ERRORS.STATUS_RATE_LIMITED },
      { status: 429 }
    );
  }

  const siteRootKey = request.nextUrl.searchParams.get("siteRootKey")?.trim();
  if (!siteRootKey || !isValidSiteRootKey(siteRootKey)) {
    return NextResponse.json({ error: "Missing or invalid siteRootKey." }, { status: 400 });
  }

  const job = await getCrawlJob(siteRootKey);
  if (!job) {
    return NextResponse.json({
      status: "idle",
      siteRootKey,
      discovered: 0,
      crawled: 0,
      indexed: 0,
      failed: 0,
    });
  }

  return NextResponse.json({
    status: job.status,
    siteRootKey: job.siteRootKey,
    discovered: job.discovered,
    crawled: job.crawled,
    indexed: job.indexed,
    failed: job.failed,
    error: job.error,
    recentPages: job.recentPages ?? [],
    indexedPages: job.indexedPages ?? [],
    currentPath: job.currentPath,
    phaseDetail: job.phaseDetail,
    startedAt: job.startedAt,
    updatedAt: job.updatedAt,
  });
}
