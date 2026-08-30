import { describe, expect, it } from "vitest";
import { sentryBeforeSend, SENTRY_IGNORE_ERRORS } from "./sentry-filters";
import type { ErrorEvent } from "@sentry/core";

describe("sentryBeforeSend", () => {
  it("drops chrome-extension noise", () => {
    const event = {
      exception: {
        values: [{ value: "Error from chrome-extension://abc/content.js" }],
      },
    } as ErrorEvent;
    expect(sentryBeforeSend(event)).toBeNull();
  });

  it("keeps ordinary app errors", () => {
    const event = {
      exception: { values: [{ value: "Cannot read properties of undefined" }] },
    } as ErrorEvent;
    expect(sentryBeforeSend(event)).toBe(event);
  });

  it("includes common ignore patterns", () => {
    expect(SENTRY_IGNORE_ERRORS.some((e) => String(e).includes("AbortError"))).toBe(
      true
    );
  });
});
