import { clampSortOrder } from "@/lib/validation/color-input";
import { isSafeProductImageUrl } from "@/lib/validation/product-input";

const MAX_NAME = 160;
const MAX_TEXT = 4000;

export function normalizeTestimonialCustomerName(raw: string): string | null {
  const t = raw.trim();
  if (!t || t.length > MAX_NAME) return null;
  return t;
}

export function normalizeTestimonialText(raw: string): string | null {
  const t = raw.trim();
  if (!t || t.length > MAX_TEXT) return null;
  return t;
}

export function clampRating(n: number): number {
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(5, Math.floor(n)));
}

export function normalizeOptionalTestimonialImageUrl(
  raw: unknown,
): { ok: true; value: string | null } | { ok: false } {
  if (raw == null || raw === "") return { ok: true, value: null };
  const s = String(raw).trim();
  if (!isSafeProductImageUrl(s)) return { ok: false };
  return { ok: true, value: s };
}

export function parseTestimonialSortOrder(raw: unknown): number {
  return clampSortOrder(Number.isFinite(Number(raw)) ? Number(raw) : 0);
}
