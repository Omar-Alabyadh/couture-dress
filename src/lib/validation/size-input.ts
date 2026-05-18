import type { SizeOptionType } from "@/generated/prisma/client";

const MAX_LABEL_LEN = 32;

export function normalizeSizeLabel(raw: string): string {
  return raw.trim().slice(0, MAX_LABEL_LEN);
}

export function isValidSizeLabel(label: string): boolean {
  const t = label.trim();
  return t.length > 0 && t.length <= MAX_LABEL_LEN;
}

export function parseSizeOptionType(raw: unknown): SizeOptionType | null {
  const t = String(raw ?? "").trim().toUpperCase();
  if (t === "STANDARD" || t === "LETTER" || t === "NUMBER") return t;
  return null;
}

export function clampSizeSortOrder(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(9999, Math.trunc(n)));
}
