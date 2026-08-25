"use server";

import { parseUserUrlInput } from "@/lib/url-security";

export async function validateChatUrl(input: string) {
  const result = await parseUserUrlInput(input);
  if (!result.ok) {
    return { ok: false as const, reason: result.reason };
  }
  return {
    ok: true as const,
    routePath: result.routePath,
    httpsUrl: result.httpsUrl,
  };
}
