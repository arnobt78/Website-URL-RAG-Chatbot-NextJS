"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, X } from "lucide-react";
import type { ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Lightweight confirmation dialog (shadcn-style, no extra deps). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              variant === "destructive" ? "bg-red-950/60 text-red-400" : "bg-zinc-800 text-sky-400"
            )}
          >
            {icon ?? (variant === "destructive" ? <AlertTriangle className="size-5" /> : null)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
                {title}
              </h2>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium text-white",
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-sky-600 hover:bg-sky-500"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
