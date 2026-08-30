/**
 * Parse a positive integer from an env-style string.
 * Returns `fallback` when missing, non-numeric, or below `min`.
 * Optionally clamps to `max`.
 */
export function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  options?: { min?: number; max?: number }
): number {
  const min = options?.min ?? 1;
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < min) return fallback;
  if (options?.max != null) return Math.min(n, options.max);
  return n;
}
