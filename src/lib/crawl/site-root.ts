/**
 * Site-wide crawl uses the hostname (and optional port) as the index key,
 * so any path on the same origin shares one vector namespace.
 */
export function siteRootKeyFromCanonical(canonicalKey: string): string {
  const slash = canonicalKey.indexOf("/");
  if (slash === -1) return canonicalKey;
  return canonicalKey.slice(0, slash);
}

export function siteOriginHttpsUrl(siteRootKey: string): string {
  return `https://${siteRootKey}/`;
}

/** Hostname or hostname:port — used to validate crawl status poll keys. */
export function isValidSiteRootKey(siteRootKey: string): boolean {
  if (!siteRootKey || siteRootKey.length > 256) return false;
  return /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?(:\d{1,5})?$/.test(siteRootKey);
}

export function isSameSiteUrl(url: string, siteRootKey: string): boolean {
  try {
    const parsed = new URL(url);
    const host =
      parsed.port && parsed.port !== "443" ? `${parsed.hostname}:${parsed.port}` : parsed.hostname;
    return host.toLowerCase() === siteRootKey.toLowerCase();
  } catch {
    return false;
  }
}
