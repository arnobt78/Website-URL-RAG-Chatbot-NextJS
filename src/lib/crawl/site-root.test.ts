import { describe, expect, it } from "vitest";

import {
  isValidSiteRootKey,
  siteOriginHttpsUrl,
  siteRootKeyFromCanonical,
} from "@/lib/crawl/site-root";

describe("siteRootKeyFromCanonical", () => {
  it("returns hostname for root URLs", () => {
    expect(siteRootKeyFromCanonical("example.com")).toBe("example.com");
  });

  it("strips path from canonical keys", () => {
    expect(siteRootKeyFromCanonical("example.com/about")).toBe("example.com");
    expect(siteRootKeyFromCanonical("example.com/blog/post")).toBe("example.com");
  });

  it("preserves port in site root key", () => {
    expect(siteRootKeyFromCanonical("example.com:8080/docs")).toBe("example.com:8080");
  });
});

describe("siteOriginHttpsUrl", () => {
  it("builds https origin URL", () => {
    expect(siteOriginHttpsUrl("example.com")).toBe("https://example.com/");
  });
});

describe("isValidSiteRootKey", () => {
  it("accepts hostname and hostname:port keys", () => {
    expect(isValidSiteRootKey("example.com")).toBe(true);
    expect(isValidSiteRootKey("sub.example.com")).toBe(true);
    expect(isValidSiteRootKey("example.com:8080")).toBe(true);
  });

  it("rejects empty, malformed, or overlong keys", () => {
    expect(isValidSiteRootKey("")).toBe(false);
    expect(isValidSiteRootKey("../evil")).toBe(false);
    expect(isValidSiteRootKey("has space.com")).toBe(false);
    expect(isValidSiteRootKey(":8080")).toBe(false);
    expect(isValidSiteRootKey("a".repeat(257))).toBe(false);
  });
});
