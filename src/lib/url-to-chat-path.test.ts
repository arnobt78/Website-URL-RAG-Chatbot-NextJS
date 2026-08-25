import { describe, expect, it } from "vitest";
import { urlToChatPath } from "./url-to-chat-path";

describe("urlToChatPath", () => {
  it("returns route path for a bare host", () => {
    expect(urlToChatPath("www.example.com")).toBe("/www.example.com");
  });

  it("returns null for blocked hosts", () => {
    expect(urlToChatPath("http://localhost")).toBeNull();
  });
});
