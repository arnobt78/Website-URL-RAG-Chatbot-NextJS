"use client";

/** Animated "Thinking..." placeholder while waiting for first stream token. */
export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2.5">
      <span className="text-sm font-medium text-zinc-400 animate-pulse">Thinking</span>
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block size-1 rounded-full bg-zinc-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.9s" }}
          />
        ))}
      </span>
    </div>
  );
}
