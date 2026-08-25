import type { ClassifiedError, ChatErrorKind } from "./types";

const RETRIABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function extractStatus(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.status === "number") return record.status;
    if (typeof record.statusCode === "number") return record.statusCode;
    if (record.response && typeof record.response === "object") {
      const response = record.response as Record<string, unknown>;
      if (typeof response.status === "number") return response.status;
    }
  }
  return undefined;
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function classifyByStatus(status: number | undefined, message: string): ClassifiedError {
  const lower = message.toLowerCase();

  if (status === 402 || lower.includes("billing") || lower.includes("payment required")) {
    return {
      kind: "billing",
      status,
      message,
      retriable: true,
      skipProvider: true,
    };
  }

  if (status === 429 || lower.includes("rate limit") || lower.includes("resource exhausted")) {
    return {
      kind: "rate_limit",
      status: 429,
      message,
      retriable: true,
      skipProvider: true,
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: "auth",
      status,
      message,
      retriable: false,
      skipProvider: true,
    };
  }

  if (status === 404 || lower.includes("not found") || lower.includes("deprecated")) {
    return {
      kind: "upstream",
      status: status ?? 404,
      message,
      retriable: true,
      skipProvider: false,
    };
  }

  if (status !== undefined && status >= 400 && status < 500 && !RETRIABLE_STATUSES.has(status)) {
    return {
      kind: "client",
      status,
      message,
      retriable: false,
      skipProvider: false,
    };
  }

  if (
    status !== undefined && RETRIABLE_STATUSES.has(status) ||
    lower.includes("timeout") ||
    lower.includes("econnreset") ||
    lower.includes("network")
  ) {
    return {
      kind: "upstream",
      status: status ?? 503,
      message,
      retriable: true,
      skipProvider: status === 429,
    };
  }

  return {
    kind: "unknown",
    status,
    message,
    retriable: true,
    skipProvider: false,
  };
}

export function classifyChatError(error: unknown): ClassifiedError {
  const message = extractMessage(error);
  const status = extractStatus(error);
  return classifyByStatus(status, message);
}

export function httpStatusForKind(kind: ChatErrorKind): number {
  switch (kind) {
    case "rate_limit":
      return 429;
    case "auth":
      return 401;
    case "billing":
      return 402;
    case "client":
      return 400;
    case "not_configured":
      return 503;
    default:
      return 502;
  }
}

export function userFacingError(
  kind: ChatErrorKind,
  provider?: string,
  model?: string
): { title: string; subtitle: string } {
  const who = provider && model ? `${provider} (${model})` : provider ?? "AI provider";

  switch (kind) {
    case "not_configured":
      return {
        title: "No AI provider configured",
        subtitle:
          "Add at least one API key (GEMINI, GROQ, OPENROUTER, or HUGGINGFACE) to your environment.",
      };
    case "rate_limit":
      return {
        title: "Rate limit reached",
        subtitle: `${who} is temporarily throttled. Please wait a moment and try again.`,
      };
    case "billing":
      return {
        title: "Provider quota exhausted",
        subtitle: `${who} free tier may be exhausted. Try again later or add another provider key.`,
      };
    case "auth":
      return {
        title: "Authentication failed",
        subtitle: `Check that your ${who} API key is valid and has not expired.`,
      };
    case "client":
      return {
        title: "Invalid request",
        subtitle: "Your message could not be processed. Try shortening it and resubmitting.",
      };
    default:
      return {
        title: "All AI providers unavailable",
        subtitle:
          "Every configured provider failed. Verify API keys and free-tier quotas, then try again.",
      };
  }
}
