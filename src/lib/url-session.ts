import { createHash } from "node:crypto";

export function urlToNamespace(canonicalKey: string): string {
  return createHash("sha256").update(canonicalKey).digest("hex").slice(0, 32);
}

/** Session ID bound to canonical URL + anonymous cookie (hashed URL prefix avoids slash collisions). */
export function buildSessionId(canonicalKey: string, cookieSessionId: string): string {
  const urlPart = createHash("sha256").update(canonicalKey).digest("hex").slice(0, 16);
  return `${urlPart}--${cookieSessionId}`;
}

export function sessionMatchesCookie(
  sessionId: string,
  canonicalKey: string,
  cookieSessionId: string
): boolean {
  return sessionId === buildSessionId(canonicalKey, cookieSessionId);
}
