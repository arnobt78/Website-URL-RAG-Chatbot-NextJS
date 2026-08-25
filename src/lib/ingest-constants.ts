/** Bump when ingest strategy changes — used for Redis dedup and vector namespace isolation. */
export const INDEX_CONTENT_VERSION = "jina-v1";

export function indexRedisKey(canonicalKey: string): string {
  return `${INDEX_CONTENT_VERSION}:${canonicalKey}`;
}
