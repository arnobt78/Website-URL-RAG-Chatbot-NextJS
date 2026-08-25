import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchPageContentAsText,
  MIN_USABLE_TEXT_CHARS,
} from "./fetch-page-content";

const HTTPS_URL = "https://www.example.com";

vi.mock("@/lib/url-security", () => ({
  parseUserUrlInput: vi.fn(),
}));

import { parseUserUrlInput } from "@/lib/url-security";

const mockParseUserUrlInput = vi.mocked(parseUserUrlInput);

function longText(length = MIN_USABLE_TEXT_CHARS): string {
  return "a".repeat(length);
}

function jinaUrl(httpsUrl: string): string {
  return `https://r.jina.ai/${httpsUrl}`;
}

function okUrl(url: string) {
  return {
    ok: true as const,
    httpsUrl: url,
    canonicalKey: "www.example.com",
    routePath: "/www.example.com",
  };
}

describe("fetchPageContentAsText", () => {
  const originalFetch = globalThis.fetch;
  const originalJinaKey = process.env.JINA_API_KEY;

  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.JINA_API_KEY;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalJinaKey === undefined) {
      delete process.env.JINA_API_KEY;
    } else {
      process.env.JINA_API_KEY = originalJinaKey;
    }
  });

  it("returns Jina text when reader returns enough content", async () => {
    const jinaText = longText();
    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input);
      expect(url).toBe(jinaUrl(HTTPS_URL));
      return new Response(jinaText, { status: 200 });
    }) as typeof fetch;

    const result = await fetchPageContentAsText(HTTPS_URL);

    expect(result).toEqual({ ok: true, text: jinaText });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("extracts text after Jina Markdown Content marker", async () => {
    const body = `Title: Example\nMarkdown Content:\n${longText()}`;
    globalThis.fetch = vi.fn(async () => new Response(body, { status: 200 })) as typeof fetch;

    const result = await fetchPageContentAsText(HTTPS_URL);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toBe(longText());
      expect(result.text.length).toBeGreaterThanOrEqual(MIN_USABLE_TEXT_CHARS);
    }
  });

  it("falls back to HTML when Jina returns too little text", async () => {
    const htmlText = longText();
    mockParseUserUrlInput.mockResolvedValue(okUrl(HTTPS_URL));

    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input);
      if (url.startsWith("https://r.jina.ai/")) {
        return new Response("short", { status: 200 });
      }
      return new Response(`<html><body><p>${htmlText}</p></body></html>`, {
        status: 200,
      });
    }) as typeof fetch;

    const result = await fetchPageContentAsText(HTTPS_URL);

    expect(result).toEqual({ ok: true, text: htmlText });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("falls back to HTML when Jina fetch fails", async () => {
    const htmlText = longText();
    mockParseUserUrlInput.mockResolvedValue(okUrl(HTTPS_URL));

    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input);
      if (url.startsWith("https://r.jina.ai/")) {
        return new Response("error", { status: 503 });
      }
      return new Response(`<html><body>${htmlText}</body></html>`, { status: 200 });
    }) as typeof fetch;

    const result = await fetchPageContentAsText(HTTPS_URL);

    expect(result).toEqual({ ok: true, text: htmlText });
  });

  it("returns error when both Jina and HTML return too little text", async () => {
    mockParseUserUrlInput.mockResolvedValue(okUrl(HTTPS_URL));

    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input);
      if (url.startsWith("https://r.jina.ai/")) {
        return new Response("tiny", { status: 200 });
      }
      return new Response("<html><body>hi</body></html>", { status: 200 });
    }) as typeof fetch;

    const result = await fetchPageContentAsText(HTTPS_URL);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/too little readable text/i);
    }
  });

  it("follows a redirect during HTML fallback", async () => {
    const redirectTarget = "https://www.example.com/final";
    const htmlText = longText();

    mockParseUserUrlInput
      .mockResolvedValueOnce(okUrl(HTTPS_URL))
      .mockResolvedValueOnce(okUrl(redirectTarget));

    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input);
      if (url.startsWith("https://r.jina.ai/")) {
        return new Response("fail", { status: 500 });
      }
      if (url === HTTPS_URL) {
        return new Response("", {
          status: 302,
          headers: { Location: "/final" },
        });
      }
      if (url === redirectTarget) {
        return new Response(`<html><body>${htmlText}</body></html>`, { status: 200 });
      }
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;

    const result = await fetchPageContentAsText(HTTPS_URL);

    expect(result).toEqual({ ok: true, text: htmlText });
    expect(mockParseUserUrlInput).toHaveBeenCalledTimes(2);
  });

  it("rejects redirect to a blocked host", async () => {
    mockParseUserUrlInput
      .mockResolvedValueOnce(okUrl(HTTPS_URL))
      .mockResolvedValueOnce({ ok: false, reason: "Host is not allowed" });

    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input);
      if (url.startsWith("https://r.jina.ai/")) {
        return new Response("fail", { status: 500 });
      }
      return new Response("", {
        status: 302,
        headers: { Location: "https://localhost/secret" },
      });
    }) as typeof fetch;

    const result = await fetchPageContentAsText(HTTPS_URL);

    expect(result).toEqual({ ok: false, reason: "Host is not allowed" });
  });

  it("fails when redirect hop limit is exceeded", async () => {
    mockParseUserUrlInput.mockImplementation(async (url) => okUrl(String(url)));

    let htmlFetchCount = 0;
    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input);
      if (url.startsWith("https://r.jina.ai/")) {
        return new Response("fail", { status: 500 });
      }
      htmlFetchCount += 1;
      return new Response("", {
        status: 302,
        headers: { Location: `https://www.example.com/hop-${htmlFetchCount}` },
      });
    }) as typeof fetch;

    const result = await fetchPageContentAsText(HTTPS_URL);

    expect(result).toEqual({
      ok: false,
      reason: "Too many redirects while fetching page HTML.",
    });
  });

  it("sends Authorization header when JINA_API_KEY is set", async () => {
    process.env.JINA_API_KEY = "test-jina-key";
    const jinaText = longText();

    globalThis.fetch = vi.fn(async (input, init) => {
      const url = String(input);
      expect(url).toBe(jinaUrl(HTTPS_URL));
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer test-jina-key");
      return new Response(jinaText, { status: 200 });
    }) as typeof fetch;

    const result = await fetchPageContentAsText(HTTPS_URL);

    expect(result.ok).toBe(true);
  });
});
