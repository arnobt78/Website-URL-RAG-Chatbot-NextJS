import { describe, expect, it } from "vitest";
import { classifyChatError } from "./errors";

describe("classifyChatError", () => {
  it("401 → skipProvider true", () => {
    const result = classifyChatError({ status: 401, message: "Unauthorized" });
    expect(result.kind).toBe("auth");
    expect(result.skipProvider).toBe(true);
    expect(result.retriable).toBe(false);
  });

  it("403 → skipProvider true", () => {
    const result = classifyChatError({ status: 403, message: "Forbidden" });
    expect(result.kind).toBe("auth");
    expect(result.skipProvider).toBe(true);
  });

  it("429 → skipProvider true", () => {
    const result = classifyChatError({ status: 429, message: "Rate limit exceeded" });
    expect(result.kind).toBe("rate_limit");
    expect(result.skipProvider).toBe(true);
    expect(result.retriable).toBe(true);
  });

  it("400 with network timeout → upstream retriable (not client)", () => {
    const result = classifyChatError({ status: 400, message: "network timeout" });
    expect(result.kind).toBe("upstream");
    expect(result.retriable).toBe(true);
    expect(result.skipProvider).toBe(false);
  });

  it("400 bad request → client non-retriable", () => {
    const result = classifyChatError({ status: 400, message: "bad request" });
    expect(result.kind).toBe("client");
    expect(result.retriable).toBe(false);
  });
});
