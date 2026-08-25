import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runWithRagChatFallback } from "./fallback-rag-chat";

const LLM_ENV_KEYS = [
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY",
  "HUGGINGFACE_API_KEY",
  "OPENAI_API_KEY",
] as const;

describe("runWithRagChatFallback", () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of LLM_ENV_KEYS) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of LLM_ENV_KEYS) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it("returns not_configured when no LLM env keys are set", async () => {
    const result = await runWithRagChatFallback(async () => "unused");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("not_configured");
      expect(result.status).toBe(503);
    }
  });
});
