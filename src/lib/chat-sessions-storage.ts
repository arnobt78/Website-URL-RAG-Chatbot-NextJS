const STORAGE_KEY = "website-url-rag-chatbot:sessions";
const STORAGE_VERSION = 1;

/** Sentinel for pre-redesign Redis history (omit chatId in API / URL). */
export const LEGACY_CHAT_ID = "00000000-0000-4000-8000-000000000000";

export function isLegacyChatId(chatId: string | undefined | null): boolean {
  return chatId === LEGACY_CHAT_ID;
}

export type StoredChatSession = {
  chatId: string;
  canonicalKey: string;
  httpsUrl: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type SessionStore = {
  version: number;
  sessions: StoredChatSession[];
};

function defaultTitle(): string {
  return `Chat ${new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date())}`;
}

export function truncateTitle(text: string, max = 40): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function titleFromFirstMessage(message: string): string {
  const truncated = truncateTitle(message);
  return truncated || defaultTitle();
}

function isStorageAvailable(): boolean {
  return typeof localStorage !== "undefined";
}

function readStore(): SessionStore {
  if (!isStorageAvailable()) {
    return { version: STORAGE_VERSION, sessions: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: STORAGE_VERSION, sessions: [] };

    const parsed = JSON.parse(raw) as SessionStore;
    if (!parsed || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.sessions)) {
      return { version: STORAGE_VERSION, sessions: [] };
    }

    return parsed;
  } catch {
    return { version: STORAGE_VERSION, sessions: [] };
  }
}

function writeStore(store: SessionStore): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function listSessions(): StoredChatSession[] {
  return readStore()
    .sessions.slice()
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function listSessionsForUrl(canonicalKey: string): StoredChatSession[] {
  return listSessions().filter((s) => s.canonicalKey === canonicalKey);
}

export function getSession(chatId: string): StoredChatSession | undefined {
  return listSessions().find((s) => s.chatId === chatId);
}

export function upsertSession(
  partial: Pick<StoredChatSession, "chatId" | "canonicalKey" | "httpsUrl"> &
    Partial<Pick<StoredChatSession, "title">>
): StoredChatSession {
  const store = readStore();
  const now = new Date().toISOString();
  const existing = store.sessions.find((s) => s.chatId === partial.chatId);

  const next: StoredChatSession = existing
    ? {
        ...existing,
        httpsUrl: partial.httpsUrl,
        canonicalKey: partial.canonicalKey,
        title: partial.title ?? existing.title,
        updatedAt: now,
      }
    : {
        chatId: partial.chatId,
        canonicalKey: partial.canonicalKey,
        httpsUrl: partial.httpsUrl,
        title: partial.title ?? defaultTitle(),
        createdAt: now,
        updatedAt: now,
      };

  store.sessions = [next, ...store.sessions.filter((s) => s.chatId !== partial.chatId)];
  writeStore(store);
  return next;
}

export function renameSession(chatId: string, title: string): StoredChatSession | null {
  const trimmed = title.trim();
  if (!trimmed) return null;

  const store = readStore();
  const index = store.sessions.findIndex((s) => s.chatId === chatId);
  if (index === -1) return null;

  const updated: StoredChatSession = {
    ...store.sessions[index],
    title: trimmed,
    updatedAt: new Date().toISOString(),
  };
  store.sessions[index] = updated;
  writeStore(store);
  return updated;
}

export function deleteSession(chatId: string): StoredChatSession | null {
  const store = readStore();
  const removed = store.sessions.find((s) => s.chatId === chatId);
  if (!removed) return null;

  store.sessions = store.sessions.filter((s) => s.chatId !== chatId);
  writeStore(store);
  return removed;
}

export function touchSession(chatId: string): void {
  const store = readStore();
  const index = store.sessions.findIndex((s) => s.chatId === chatId);
  if (index === -1) return;

  store.sessions[index] = {
    ...store.sessions[index],
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
}

/**
 * Pick or create the active chat for a URL.
 * Returns LEGACY_CHAT_ID when preserving pre-redesign Redis history (no chatId suffix).
 */
export function ensureSessionForUrl(
  canonicalKey: string,
  httpsUrl: string,
  preferredChatId?: string,
  hasServerHistory = false
): string {
  if (preferredChatId && !isLegacyChatId(preferredChatId)) {
    const existing = getSession(preferredChatId);
    if (!existing || existing.canonicalKey === canonicalKey) {
      upsertSession({ chatId: preferredChatId, canonicalKey, httpsUrl });
      return preferredChatId;
    }
  }

  if (preferredChatId && isLegacyChatId(preferredChatId)) {
    upsertSession({
      chatId: LEGACY_CHAT_ID,
      canonicalKey,
      httpsUrl,
      title: "Previous chat",
    });
    return LEGACY_CHAT_ID;
  }

  const forUrl = listSessionsForUrl(canonicalKey);
  if (forUrl.length > 0) {
    upsertSession({
      chatId: forUrl[0].chatId,
      canonicalKey,
      httpsUrl,
    });
    return forUrl[0].chatId;
  }

  if (hasServerHistory) {
    upsertSession({
      chatId: LEGACY_CHAT_ID,
      canonicalKey,
      httpsUrl,
      title: "Previous chat",
    });
    return LEGACY_CHAT_ID;
  }

  const chatId = crypto.randomUUID();
  upsertSession({ chatId, canonicalKey, httpsUrl });
  return chatId;
}

export function createNewSession(canonicalKey: string, httpsUrl: string): StoredChatSession {
  const chatId = crypto.randomUUID();
  return upsertSession({ chatId, canonicalKey, httpsUrl });
}
