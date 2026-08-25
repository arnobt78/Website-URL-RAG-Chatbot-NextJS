import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  deleteSession,
  ensureSessionForUrl,
  LEGACY_CHAT_ID,
  listSessions,
  renameSession,
  getSession,
  titleFromFirstMessage,
  truncateTitle,
  upsertSession,
} from "./chat-sessions-storage";

describe("chat-sessions-storage helpers", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
  });

  it("truncateTitle shortens long strings", () => {
    expect(truncateTitle("hello")).toBe("hello");
    expect(truncateTitle("a".repeat(50))).toHaveLength(40);
    expect(truncateTitle("a".repeat(50)).endsWith("…")).toBe(true);
  });

  it("titleFromFirstMessage uses truncated question", () => {
    expect(titleFromFirstMessage("What is this page about?")).toBe("What is this page about?");
  });

  it("upsertSession creates and lists sessions", () => {
    upsertSession({
      chatId: "11111111-1111-4111-8111-111111111111",
      canonicalKey: "www.example.com",
      httpsUrl: "https://www.example.com",
      title: "Test chat",
    });

    const sessions = listSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].title).toBe("Test chat");
  });

  it("renameSession updates title", () => {
    upsertSession({
      chatId: "11111111-1111-4111-8111-111111111111",
      canonicalKey: "www.example.com",
      httpsUrl: "https://www.example.com",
    });

    const updated = renameSession("11111111-1111-4111-8111-111111111111", "Renamed");
    expect(updated?.title).toBe("Renamed");
  });

  it("deleteSession removes entry", () => {
    upsertSession({
      chatId: "11111111-1111-4111-8111-111111111111",
      canonicalKey: "www.example.com",
      httpsUrl: "https://www.example.com",
    });

    deleteSession("11111111-1111-4111-8111-111111111111");
    expect(listSessions()).toHaveLength(0);
  });

  it("ensureSessionForUrl honors URL chatId not yet in localStorage", () => {
    const chatId = "22222222-2222-4222-8222-222222222222";
    const result = ensureSessionForUrl(
      "www.example.com",
      "https://www.example.com",
      chatId
    );
    expect(result).toBe(chatId);
    expect(getSession(chatId)?.canonicalKey).toBe("www.example.com");
  });

  it("ensureSessionForUrl rejects cross-site chatId", () => {
    upsertSession({
      chatId: "33333333-3333-4333-8333-333333333333",
      canonicalKey: "www.other.com",
      httpsUrl: "https://www.other.com",
    });

    const result = ensureSessionForUrl(
      "www.example.com",
      "https://www.example.com",
      "33333333-3333-4333-8333-333333333333"
    );
    expect(result).not.toBe("33333333-3333-4333-8333-333333333333");
    expect(getSession("33333333-3333-4333-8333-333333333333")?.canonicalKey).toBe(
      "www.other.com"
    );
  });

  it("ensureSessionForUrl registers Previous chat for legacy Redis history", () => {
    const result = ensureSessionForUrl(
      "www.example.com",
      "https://www.example.com",
      undefined,
      true
    );
    expect(result).toBe(LEGACY_CHAT_ID);
    expect(listSessions()).toHaveLength(1);
    expect(listSessions()[0].title).toBe("Previous chat");
  });
});
