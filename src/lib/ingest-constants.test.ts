import { describe, expect, it } from "vitest";
import { INDEX_CONTENT_VERSION, indexRedisKey } from "./ingest-constants";
import { urlToNamespace } from "./url-session";

describe("indexRedisKey", () => {
  it("includes content version so ingest strategy changes trigger re-index", () => {
    expect(indexRedisKey("www.example.com")).toBe(
      `${INDEX_CONTENT_VERSION}:www.example.com`
    );
  });
});

describe("urlToNamespace", () => {
  it("includes content version so vector namespaces isolate ingest generations", () => {
    const ns = urlToNamespace("www.example.com");
    expect(ns).toHaveLength(32);
    expect(ns).not.toBe(urlToNamespace("www.other.com"));
  });
});
