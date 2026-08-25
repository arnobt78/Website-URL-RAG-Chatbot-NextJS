import { redis } from "@/lib/redis";

/** Soft chat rate limit: max requests per IP per window. Immediate 429 — no sleep/delay. */
const CHAT_WINDOW_SECONDS = 60;
const CHAT_MAX_REQUESTS = 30;

/** Ingest rate limit: max first-visit index operations per IP per window. */
const INGEST_WINDOW_SECONDS = 60;
const INGEST_MAX_PER_IP = 10;

/** Global ingest cap across all IPs per window. */
const INGEST_MAX_GLOBAL = 100;

async function incrementWithExpiry(key: string, windowSeconds: number): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count;
}

/**
 * Redis INCR + EXPIRE rate limiter for expensive chat/LLM routes.
 * Returns true when the request is allowed; false when over the limit.
 */
export async function allowChatRequest(ip: string): Promise<boolean> {
  const count = await incrementWithExpiry(`rl:chat:${ip}`, CHAT_WINDOW_SECONDS);
  return count <= CHAT_MAX_REQUESTS;
}

/**
 * Rate limiter for SSR URL ingest (scrape + embed).
 * Applies per-IP and global caps.
 */
export async function allowIngestRequest(ip: string): Promise<boolean> {
  const ipCount = await incrementWithExpiry(`rl:ingest:ip:${ip}`, INGEST_WINDOW_SECONDS);
  if (ipCount > INGEST_MAX_PER_IP) {
    return false;
  }

  const globalCount = await incrementWithExpiry("rl:ingest:global", INGEST_WINDOW_SECONDS);
  return globalCount <= INGEST_MAX_GLOBAL;
}
