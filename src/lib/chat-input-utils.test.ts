import { describe, expect, it } from "vitest";
import { canSubmitChatInput } from "./chat-input-utils";

describe("canSubmitChatInput", () => {
  it("blocks when loading", () => {
    expect(canSubmitChatInput(true, "hello")).toBe(false);
  });

  it("blocks when input is empty or whitespace", () => {
    expect(canSubmitChatInput(false, "")).toBe(false);
    expect(canSubmitChatInput(false, "   ")).toBe(false);
  });

  it("allows when not loading and input has content", () => {
    expect(canSubmitChatInput(false, "hello")).toBe(true);
  });
});
