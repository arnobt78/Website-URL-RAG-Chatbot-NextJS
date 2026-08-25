import "server-only";

import { parseUserUrlInput } from "@/lib/url-security";

const MIN_USABLE_TEXT_CHARS = 200;
const MAX_REDIRECT_HOPS = 3;

/**
 * Fetch readable page text for RAG ingest.
 * Uses Jina Reader (handles JS-heavy / Next.js SPAs). Falls back to raw HTML strip.
 */
export async function fetchPageContentAsText(
  httpsUrl: string
): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  const jinaResult = await fetchViaJinaReader(httpsUrl);
  if (jinaResult.ok && jinaResult.text.length >= MIN_USABLE_TEXT_CHARS) {
    return jinaResult;
  }

  const rawResult = await fetchRawHtmlText(httpsUrl);
  if (rawResult.ok && rawResult.text.length >= MIN_USABLE_TEXT_CHARS) {
    return rawResult;
  }

  if (jinaResult.ok) {
    return {
      ok: false,
      reason:
        "Page returned too little readable text. The site may block scrapers or require login.",
    };
  }

  if (rawResult.ok) {
    return {
      ok: false,
      reason:
        "Page returned too little readable text. The site may be JavaScript-only or block scrapers.",
    };
  }

  return rawResult;
}

async function fetchViaJinaReader(
  httpsUrl: string
): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  const readerUrl = `https://r.jina.ai/${httpsUrl}`;
  const headers: Record<string, string> = {
    Accept: "text/plain",
  };

  const apiKey = process.env.JINA_API_KEY?.trim();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(readerUrl, {
      headers,
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      return {
        ok: false,
        reason: `Reader service returned ${res.status}. Try again shortly.`,
      };
    }

    const body = (await res.text()).trim();
    const text = extractJinaMarkdown(body);

    if (!text) {
      return { ok: false, reason: "Reader returned empty content." };
    }

    return { ok: true, text };
  } catch {
    return { ok: false, reason: "Could not fetch page content for indexing." };
  }
}

function extractJinaMarkdown(body: string): string {
  const marker = "Markdown Content:";
  const idx = body.indexOf(marker);
  if (idx === -1) {
    return body;
  }
  return body.slice(idx + marker.length).trim();
}

async function fetchRawHtmlText(
  httpsUrl: string
): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  try {
    let currentUrl = httpsUrl;

    for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
      const validated = await parseUserUrlInput(currentUrl);
      if (!validated.ok) {
        return { ok: false, reason: validated.reason };
      }

      const res = await fetch(validated.httpsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; WebsiteURLRAGBot/1.0; +https://github.com/arnobt78/ai-rag-chatbot)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(20_000),
        redirect: "manual",
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location || hop === MAX_REDIRECT_HOPS) {
          return { ok: false, reason: "Too many redirects while fetching page HTML." };
        }

        currentUrl = new URL(location, validated.httpsUrl).href;
        continue;
      }

      if (!res.ok) {
        return { ok: false, reason: `Site returned HTTP ${res.status}.` };
      }

      const html = await res.text();
      const text = stripHtmlToText(html);

      if (!text) {
        return { ok: false, reason: "HTML contained no extractable text." };
      }

      return { ok: true, text };
    }

    return { ok: false, reason: "Could not fetch page HTML." };
  } catch {
    return { ok: false, reason: "Could not fetch page HTML." };
  }
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export { MIN_USABLE_TEXT_CHARS };
