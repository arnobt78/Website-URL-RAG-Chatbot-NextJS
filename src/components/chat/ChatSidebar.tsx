"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createNewSession,
  deleteSession,
  isLegacyChatId,
  listSessions,
  renameSession,
  type StoredChatSession,
} from "@/lib/chat-sessions-storage";
import { urlToChatPath } from "@/lib/url-to-chat-path";
import { cn } from "@/lib/utils";
import { Menu, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type SessionFilter = "all" | "site";

type ChatSidebarProps = {
  canonicalKey: string;
  httpsUrl: string;
  activeChatId?: string;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onSessionsChange?: () => void;
  refreshToken?: number;
};

function displayUrlSubtitle(httpsUrl: string): string {
  try {
    const url = new URL(httpsUrl);
    return url.hostname + url.pathname.replace(/\/$/, "");
  } catch {
    return httpsUrl;
  }
}

export function ChatSidebar({
  canonicalKey,
  httpsUrl,
  activeChatId,
  mobileOpen,
  onMobileOpenChange,
  onSessionsChange,
  refreshToken = 0,
}: ChatSidebarProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<SessionFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<StoredChatSession | null>(null);
  const [renameTarget, setRenameTarget] = useState<StoredChatSession | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const sessions = useMemo(() => {
    void refreshToken;
    const all = listSessions();
    return filter === "site" ? all.filter((s) => s.canonicalKey === canonicalKey) : all;
  }, [canonicalKey, filter, refreshToken]);

  const refresh = useCallback(() => {
    onSessionsChange?.();
  }, [onSessionsChange]);

  const navigateToSession = (session: StoredChatSession) => {
    const path = urlToChatPath(session.httpsUrl);
    if (!path) return;
    if (isLegacyChatId(session.chatId)) {
      router.push(path);
    } else {
      router.push(`${path}?chat=${session.chatId}`);
    }
    onMobileOpenChange(false);
  };

  const handleNewChat = () => {
    const session = createNewSession(canonicalKey, httpsUrl);
    refresh();
    const path = urlToChatPath(httpsUrl);
    if (path) {
      router.push(`${path}?chat=${session.chatId}`);
    }
    onMobileOpenChange(false);
    toast.success("New chat started", {
      description: session.title,
      icon: <Plus className="size-4" />,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch("/api/chat-history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canonicalUrl: deleteTarget.canonicalKey,
          ...(isLegacyChatId(deleteTarget.chatId)
            ? {}
            : { chatId: deleteTarget.chatId }),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { subtitle?: string };
        toast.error("Could not delete chat", {
          description: data.subtitle ?? "Try again shortly.",
        });
        return;
      }

      deleteSession(deleteTarget.chatId);
      refresh();
      toast.success("Chat deleted", {
        description: `"${deleteTarget.title}" was removed.`,
        icon: <Trash2 className="size-4" />,
      });

      if (deleteTarget.chatId === activeChatId) {
        handleNewChat();
      }
    } catch {
      toast.error("Connection failed", { description: "Could not delete chat history." });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleRenameConfirm = () => {
    if (!renameTarget) return;
    const updated = renameSession(renameTarget.chatId, renameValue);
    if (!updated) {
      toast.error("Invalid title", { description: "Enter a non-empty chat name." });
      return;
    }
    refresh();
    toast.success("Chat renamed", {
      description: `Renamed to "${updated.title}".`,
      icon: <Pencil className="size-4" />,
    });
    setRenameTarget(null);
    setRenameValue("");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Chat list</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            aria-label="New chat"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMobileOpenChange(false)}
            className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-zinc-800 px-3 py-2">
        {(["all", "site"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition",
              filter === key
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            )}
          >
            {key === "all" ? "All chats" : "This site"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-zinc-500">No chats yet. Start one with +.</p>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => {
              const isActive = session.chatId === activeChatId;
              return (
                <li key={session.chatId}>
                  <div
                    className={cn(
                      "group flex items-start gap-1 rounded-lg border px-2 py-2 transition",
                      isActive
                        ? "border-sky-700/50 bg-sky-950/30"
                        : "border-transparent hover:border-zinc-800 hover:bg-zinc-900"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => navigateToSession(session)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-medium text-zinc-100">{session.title}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {displayUrlSubtitle(session.httpsUrl)}
                      </p>
                    </button>
                    <div className="flex shrink-0 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setRenameTarget(session);
                          setRenameValue(session.title);
                        }}
                        className="inline-flex size-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        aria-label={`Rename ${session.title}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(session)}
                        className="inline-flex size-7 items-center justify-center rounded text-zinc-500 hover:bg-red-950/50 hover:text-red-400"
                        aria-label={`Delete ${session.title}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => onMobileOpenChange(true)}
        className="absolute left-3 top-3 z-20 inline-flex size-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 lg:hidden"
        aria-label="Open chat list"
      >
        <Menu className="size-4" />
      </button>

      <aside className="hidden h-full w-72 shrink-0 border-r border-zinc-800 lg:block">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close sidebar overlay"
            onClick={() => onMobileOpenChange(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete chat?"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This removes chat history for this conversation.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        icon={<Trash2 className="size-5" />}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />

      {renameTarget ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sky-400">
                <Pencil className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white">Rename chat</h2>
                <p className="mt-1 text-sm text-zinc-400">Enter a new name for this conversation.</p>
                <input
                  id="rename-chat-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameConfirm();
                    if (e.key === "Escape") {
                      setRenameTarget(null);
                      setRenameValue("");
                    }
                  }}
                  className="mt-3 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-600"
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRenameTarget(null);
                  setRenameValue("");
                }}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenameConfirm}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
