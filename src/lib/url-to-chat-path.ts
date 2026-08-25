import { validateParsedUrl } from "@/lib/url-validation";

/**
 * Client-safe URL → route path conversion (structural + literal IP/hostname blocks).
 * Full DNS SSRF validation runs server-side on page load and chat API.
 */
export function urlToChatPath(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let urlStr = trimmed;
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return null;
  }

  const result = validateParsedUrl(parsed);
  return result.ok ? result.routePath : null;
}
