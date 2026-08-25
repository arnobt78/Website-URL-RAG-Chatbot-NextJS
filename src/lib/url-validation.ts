export type SafePublicUrl =
  | {
      ok: true;
      httpsUrl: string;
      canonicalKey: string;
      routePath: string;
    }
  | { ok: false; reason: string };

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
]);

const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[\da-f:]+$/i;

export function isBlockedIp(ip: string): boolean {
  if (IPV4_RE.test(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.some((p) => p > 255)) return true;
    const [a, b] = parts;

    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
    return false;
  }

  if (IPV6_RE.test(ip) && ip.includes(":")) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe80:")) return true;
    return false;
  }

  return false;
}

export function isIpLiteral(hostname: string): boolean {
  return IPV4_RE.test(hostname) || (hostname.includes(":") && IPV6_RE.test(hostname));
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".localhost")) return true;
  if (host.endsWith(".local")) return true;
  if (host === "169.254.169.254") return true;
  return false;
}

export function buildRoutePath(host: string, pathname: string): string {
  const pathSegments = pathname.split("/").filter(Boolean);
  const segments = [host, ...pathSegments].map((s) => encodeURIComponent(s));
  return `/${segments.join("/")}`;
}

export function buildCanonicalKey(host: string, pathname: string, search: string): string {
  const path = pathname === "/" ? "" : pathname;
  return `${host}${path}${search}`;
}

/** Structural URL validation (no DNS). Safe for client and server. */
export function validateParsedUrl(parsed: URL): SafePublicUrl {
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: "Only http(s) URLs are allowed" };
  }

  const hostname = parsed.hostname;
  if (!hostname) {
    return { ok: false, reason: "Missing hostname" };
  }

  if (isBlockedHostname(hostname)) {
    return { ok: false, reason: "Host is not allowed" };
  }

  if (isIpLiteral(hostname) && isBlockedIp(hostname)) {
    return { ok: false, reason: "IP address is not allowed" };
  }

  const httpsUrl = `https://${hostname}${parsed.port && parsed.port !== "443" ? `:${parsed.port}` : ""}${parsed.pathname === "/" ? "" : parsed.pathname}${parsed.search}`;
  const hostWithPort =
    parsed.port && parsed.port !== "443" ? `${hostname}:${parsed.port}` : hostname;
  const canonicalKey = buildCanonicalKey(hostWithPort, parsed.pathname, parsed.search);
  const routePath = buildRoutePath(hostWithPort, parsed.pathname);

  return { ok: true, httpsUrl, canonicalKey, routePath };
}
