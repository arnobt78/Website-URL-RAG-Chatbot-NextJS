import {
  RAGChat,
  custom,
  groq,
  openai,
  openrouter,
  type ChatOpenAI,
} from "@upstash/rag-chat";
import { redis } from "@/lib/redis";
import { classifyChatError, httpStatusForKind, userFacingError } from "./errors";
import {
  AI_PROVIDERS,
  GEMINI_OPENAI_BASE_URL,
  getConfiguredProviders,
  HUGGINGFACE_ROUTER_BASE_URL,
} from "./providers";
import type {
  ChatStreamFailure,
  ChatStreamSuccess,
  ChatWithFallbackOptions,
  ProviderConfig,
  ProviderKind,
} from "./types";

function buildModel(provider: ProviderConfig, model: string): ChatOpenAI {
  const apiKey = process.env[provider.envKey]?.trim();

  if (!apiKey) {
    throw new Error(`Missing ${provider.envKey}`);
  }

  switch (provider.id as ProviderKind) {
    case "gemini":
      return custom(model, {
        apiKey,
        baseUrl: GEMINI_OPENAI_BASE_URL,
      });
    case "groq":
      return groq(model, { apiKey });
    case "openrouter":
      return openrouter(model, { apiKey });
    case "huggingface":
      return custom(model, {
        apiKey,
        baseUrl: HUGGINGFACE_ROUTER_BASE_URL,
      });
    case "openai":
      return openai(model as Parameters<typeof openai>[0], { apiKey });
    default:
      throw new Error(`Unsupported provider: ${provider.id}`);
  }
}

export function createRagChat(provider: ProviderConfig, model: string): RAGChat {
  return new RAGChat({
    model: buildModel(provider, model),
    redis,
  });
}

export function createDefaultRagChat(): RAGChat {
  const configured = getConfiguredProviders()[0];
  if (!configured) {
    throw new Error(
      "No LLM provider configured. Set GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, or HUGGINGFACE_API_KEY."
    );
  }
  return createRagChat(configured, configured.models[0]);
}

type RagChatAttemptSuccess<T> = {
  ok: true;
  result: T;
  provider: string;
  model: string;
};

/**
 * Runs a RAGChat operation with the same provider/model fallback chain as chat.
 * Used for SSR ingest + history so a bad first key does not block indexing.
 */
export async function runWithRagChatFallback<T>(
  operation: (client: RAGChat) => Promise<T>
): Promise<RagChatAttemptSuccess<T> | ChatStreamFailure> {
  const configured = getConfiguredProviders();

  if (configured.length === 0) {
    const facing = userFacingError("not_configured");
    return {
      ok: false,
      kind: "not_configured",
      status: httpStatusForKind("not_configured"),
      title: facing.title,
      subtitle: facing.subtitle,
    };
  }

  let lastFailure: ChatStreamFailure | undefined;

  for (const provider of configured) {
    let skipProvider = false;

    for (const model of provider.models) {
      if (skipProvider) break;

      try {
        const client = createRagChat(provider, model);
        const result = await operation(client);

        return {
          ok: true,
          result,
          provider: provider.label,
          model,
        };
      } catch (error) {
        const classified = classifyChatError(error);
        const facing = userFacingError(classified.kind, provider.label, model);

        lastFailure = {
          ok: false,
          kind: classified.kind,
          status: classified.status ?? httpStatusForKind(classified.kind),
          title: facing.title,
          subtitle: facing.subtitle,
          provider: provider.label,
          model,
        };

        if (!classified.retriable && !classified.skipProvider) {
          return lastFailure;
        }

        if (classified.skipProvider) {
          skipProvider = true;
          break;
        }
      }
    }
  }

  return (
    lastFailure ?? {
      ok: false,
      kind: "upstream",
      status: 502,
      title: "All AI providers unavailable",
      subtitle: "Every configured provider failed. Verify API keys and try again.",
    }
  );
}

export async function chatWithFallback(
  message: string,
  options: ChatWithFallbackOptions
): Promise<ChatStreamSuccess | ChatStreamFailure> {
  const result = await runWithRagChatFallback(async (client) =>
    client.chat(message, options)
  );

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    response: result.result,
    provider: result.provider,
    model: result.model,
  };
}

/** Expose provider list for diagnostics (no secrets). */
export function listConfiguredProviderLabels(): string[] {
  return getConfiguredProviders().map((p) => p.label);
}

export { AI_PROVIDERS };
