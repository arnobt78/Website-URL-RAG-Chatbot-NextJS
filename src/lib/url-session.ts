import { createHash } from "node:crypto";
import { INDEX_CONTENT_VERSION } from "@/lib/ingest-constants";

export function urlToNamespace(canonicalKey: string): string {
  return createHash("sha256")
    .update(`${INDEX_CONTENT_VERSION}:${canonicalKey}`)
    .digest("hex")
    .slice(0, 32);
}

/** Session ID bound to canonical URL + anonymous cookie (hashed URL prefix avoids slash collisions). */
export function buildSessionId(
  canonicalKey: string,
  cookieSessionId: string,
  chatId?: string
): string {
  const urlPart = createHash("sha256").update(canonicalKey).digest("hex").slice(0, 16);
  const base = `${urlPart}--${cookieSessionId}`;
  return chatId ? `${base}--${chatId}` : base;
}

export function sessionMatchesCookie(
  sessionId: string,
  canonicalKey: string,
  cookieSessionId: string,
  chatId?: string
): boolean {
  return sessionId === buildSessionId(canonicalKey, cookieSessionId, chatId);
}
