import "server-only";

import { redis } from "@/lib/redis";

export type IndexSnapshot = {
  indexed: number;
  discovered?: number;
  indexedPages?: string[];
  updatedAt: string;
};

const SNAPSHOT_TTL_SECONDS = 60 * 60 * 24 * 90;

function snapshotKey(siteRootKey: string): string {
  return `crawl:index-meta:${siteRootKey}`;
}

export async function saveIndexSnapshot(
  siteRootKey: string,
  snapshot: Omit<IndexSnapshot, "updatedAt"> & { updatedAt?: string }
): Promise<void> {
  const record: IndexSnapshot = {
    ...snapshot,
    updatedAt: snapshot.updatedAt ?? new Date().toISOString(),
  };
  await redis.set(snapshotKey(siteRootKey), JSON.stringify(record), {
    ex: SNAPSHOT_TTL_SECONDS,
  });
}

export async function getIndexSnapshot(siteRootKey: string): Promise<IndexSnapshot | null> {
  const raw = await redis.get<string>(snapshotKey(siteRootKey));
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as IndexSnapshot;
    } catch {
      return null;
    }
  }
  return raw as IndexSnapshot;
}

export async function deleteIndexSnapshot(siteRootKey: string): Promise<void> {
  await redis.del(snapshotKey(siteRootKey));
}
