const HIGH_VALUE_PATH_RE =
  /^\/(about|contact|resume|cv|bio|profile|team|services|projects|portfolio|work|blog|docs|faq|pricing)(\/|$)/i;

const LOW_VALUE_PATH_RE =
  /^\/(tag|tags|category|categories|page|feed|rss|wp-json|api|cdn-cgi|assets|static|_next)(\/|$)/i;

const ASSET_EXT_RE = /\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|map|pdf|zip|xml|json|woff2?|ttf|eot)$/i;

function pathScore(pathname: string): number {
  if (pathname === "/" || pathname === "") return 100;
  if (ASSET_EXT_RE.test(pathname)) return -100;
  if (LOW_VALUE_PATH_RE.test(pathname)) return 10;
  if (HIGH_VALUE_PATH_RE.test(pathname)) return 80;
  return 40;
}

/** Sort discovered URLs: homepage and high-value paths first, assets last. Keeps hash URLs as separate entries. */
export function prioritizeSiteUrls(urls: string[], siteOriginUrl: string): string[] {
  let origin: URL;
  try {
    origin = new URL(siteOriginUrl);
  } catch {
    return urls;
  }

  const seen = new Set<string>();
  const scored: { url: string; score: number }[] = [];

  for (const raw of urls) {
    let parsed: URL;
    try {
      parsed = new URL(raw, origin.href);
    } catch {
      continue;
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") continue;
    if (parsed.hostname.toLowerCase() !== origin.hostname.toLowerCase()) continue;

    const hash = parsed.hash;
    parsed.hash = "";
    let normalized = parsed.href;
    if (normalized.endsWith("/") && parsed.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    if (hash) {
      normalized = `${normalized}${hash}`;
    }

    if (seen.has(normalized)) continue;
    seen.add(normalized);

    scored.push({
      url: normalized,
      score: pathScore(parsed.pathname) + (hash ? 5 : 0),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.url);
}

export function selectUrlsForCrawl(urls: string[], maxPages: number): string[] {
  if (urls.length <= maxPages) return urls;
  return urls.slice(0, maxPages);
}
