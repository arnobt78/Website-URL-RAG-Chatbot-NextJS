/** Bump when ingest strategy changes — used for Redis dedup and vector namespace isolation. */
export const INDEX_CONTENT_VERSION = "site-crawl-v2";

export function indexRedisKey(canonicalKey: string): string {
  return `${INDEX_CONTENT_VERSION}:${canonicalKey}`;
}
