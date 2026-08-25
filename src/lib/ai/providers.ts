import type { ProviderConfig } from "./types";

/** Gemini OpenAI-compatible endpoint (Google AI Studio). */
export const GEMINI_OPENAI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";

/** Hugging Face Inference Providers router. */
export const HUGGINGFACE_ROUTER_BASE_URL = "https://router.huggingface.co/v1";

/**
 * Ordered provider registry — first configured provider wins.
 * Model chains are tried in order within each provider.
 * Re-verify free models periodically (OpenRouter churn is high).
 * @see https://openrouter.ai/models?max_price=0
 */
export const AI_PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    envKey: "GEMINI_API_KEY",
    models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"],
  },
  {
    id: "groq",
    label: "GroqCloud",
    envKey: "GROQ_API_KEY",
    models: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    models: [
      "openai/gpt-oss-20b:free",
      "nvidia/nemotron-nano-9b-v2:free",
      "google/gemma-3-27b-it:free",
    ],
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    envKey: "HUGGINGFACE_API_KEY",
    models: [
      "meta-llama/Meta-Llama-3-8B-Instruct",
      "Qwen/Qwen2.5-7B-Instruct",
      "mistralai/Mistral-7B-Instruct-v0.3",
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    models: ["gpt-4o-mini", "gpt-3.5-turbo"],
  },
];

export function getConfiguredProviders(): ProviderConfig[] {
  return AI_PROVIDERS.filter((p) => Boolean(process.env[p.envKey]?.trim()));
}

export function getFirstConfiguredProvider(): ProviderConfig | undefined {
  return getConfiguredProviders()[0];
}
