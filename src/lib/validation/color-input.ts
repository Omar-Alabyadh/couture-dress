const LABEL_MAX = 120;
const HEX_NO_HASH = /^[0-9a-fA-F]{3,8}$/;

export function normalizeColorLabel(label: string): string | null {
  const t = label.trim();
  if (!t || t.length > LABEL_MAX) return null;
  return t;
}

/** Accepts optional leading `#`; stores lowercase hex without `#` (matches admin UI). */
export function normalizeOptionalColorHex(
  raw: unknown,
): { ok: true; value: string | null } | { ok: false } {
  if (raw == null || raw === "") return { ok: true, value: null };
  const t = String(raw).trim().replace(/^#/, "");
  if (!HEX_NO_HASH.test(t)) return { ok: false };
  return { ok: true, value: t.toLowerCase() };
}

export function clampSortOrder(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(-10_000, Math.min(10_000, Math.floor(n)));
}
