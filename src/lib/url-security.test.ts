import { describe, expect, it } from "vitest";
import { buildSessionId, sessionMatchesCookie, urlToNamespace } from "./url-session";
import { isBlockedIp, validateParsedUrl } from "./url-validation";

describe("validateParsedUrl", () => {
  it("normalizes bare host to https", () => {
    const result = validateParsedUrl(new URL("https://www.example.com"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.httpsUrl).toBe("https://www.example.com");
      expect(result.routePath).toBe("/www.example.com");
    }
  });

  it("rejects localhost", () => {
    const result = validateParsedUrl(new URL("http://localhost"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/not allowed/i);
    }
  });

  it("rejects private IP literals", () => {
    expect(isBlockedIp("192.168.1.1")).toBe(true);
    const result = validateParsedUrl(new URL("https://192.168.1.1"));
    expect(result.ok).toBe(false);
  });

  it("builds path from nested routes", () => {
    const result = validateParsedUrl(new URL("https://www.example.com/en/page"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.httpsUrl).toBe("https://www.example.com/en/page");
      expect(result.routePath).toBe("/www.example.com/en/page");
    }
  });
});

describe("session binding helpers", () => {
  it("builds and verifies session id", () => {
    const sessionId = buildSessionId("www.example.com", "uuid-a");
    expect(sessionId).toMatch(/^[a-f0-9]{16}--uuid-a$/);
    expect(sessionMatchesCookie(sessionId, "www.example.com", "uuid-a")).toBe(true);
    expect(sessionMatchesCookie("other--uuid-a", "www.example.com", "uuid-a")).toBe(false);
  });

  it("does not collide when slashes differ in canonical keys", () => {
    const cookie = "uuid-a";
    const a = buildSessionId("example.com/a/b", cookie);
    const b = buildSessionId("example.com/ab", cookie);
    expect(a).not.toBe(b);
  });
});

describe("urlToNamespace", () => {
  it("returns stable 32-char hex", () => {
    const ns = urlToNamespace("www.example.com");
    expect(ns).toHaveLength(32);
    expect(urlToNamespace("www.example.com")).toBe(ns);
  });
});
