import dns from "node:dns/promises";
import {
  isBlockedHostname,
  isBlockedIp,
  isIpLiteral,
  validateParsedUrl,
  type SafePublicUrl,
} from "./url-validation";

export type { SafePublicUrl } from "./url-validation";
export { buildSessionId, sessionMatchesCookie, urlToNamespace } from "./url-session";

async function assertPublicResolvableHost(hostname: string): Promise<string | null> {
  if (isBlockedHostname(hostname)) {
    return "Host is not allowed";
  }

  if (isIpLiteral(hostname)) {
    return isBlockedIp(hostname) ? "IP address is not allowed" : null;
  }

  try {
    const results = await dns.lookup(hostname, { all: true, verbatim: true });
    if (results.length === 0) {
      return "Could not resolve host";
    }
    for (const { address } of results) {
      if (isBlockedIp(address)) {
        return "Host resolves to a private or restricted address";
      }
    }
    return null;
  } catch {
    return "Could not resolve host";
  }
}

async function validateWithDns(parsed: URL): Promise<SafePublicUrl> {
  const structural = validateParsedUrl(parsed);
  if (!structural.ok) {
    return structural;
  }

  const hostError = await assertPublicResolvableHost(parsed.hostname);
  if (hostError) {
    return { ok: false, reason: hostError };
  }

  return structural;
}

export async function parseUserUrlInput(input: string): Promise<SafePublicUrl> {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, reason: "URL is empty" };
  }

  let urlStr = trimmed;
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  return validateWithDns(parsed);
}

export async function parseCatchAllSegments(segments: string[]): Promise<SafePublicUrl> {
  if (!segments?.length) {
    return { ok: false, reason: "URL path is empty" };
  }

  const decoded = segments.map((s) => decodeURIComponent(s)).filter(Boolean);
  if (decoded.length === 0) {
    return { ok: false, reason: "URL path is empty" };
  }

  const [host, ...pathParts] = decoded;
  const pathname = pathParts.length > 0 ? `/${pathParts.join("/")}` : "/";

  let parsed: URL;
  try {
    parsed = new URL(`https://${host}${pathname}`);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  return validateWithDns(parsed);
}
