import "server-only";

import { Langfuse } from "langfuse";

let client: Langfuse | null | undefined;

function isLangfuseConfigured(): boolean {
  return Boolean(
    process.env.LANGFUSE_PUBLIC_KEY?.trim() && process.env.LANGFUSE_SECRET_KEY?.trim()
  );
}

/** Lazy Langfuse client — returns null when keys are missing (local/CI safe). */
export function getLangfuse(): Langfuse | null {
  if (client !== undefined) return client;
  if (!isLangfuseConfigured()) {
    client = null;
    return null;
  }

  client = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY!.trim(),
    secretKey: process.env.LANGFUSE_SECRET_KEY!.trim(),
    baseUrl: process.env.LANGFUSE_BASE_URL?.trim() || "https://cloud.langfuse.com",
  });
  return client;
}

export async function flushLangfuse(): Promise<void> {
  if (!client) return;
  try {
    await client.flushAsync();
  } catch {
    /* never fail the request on telemetry */
  }
}

export function truncateForTrace(text: string, max = 2000): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
