import type { BrandDesignerType } from "@/generated/prisma/client";
import { clampSortOrder } from "@/lib/validation/color-input";
import { isSafeProductImageUrl } from "@/lib/validation/product-input";

const MAX_NAME_AR = 200;
const MAX_NAME_EN = 200;
const MAX_DESC = 4000;

export function normalizeBrandNameAr(raw: string): string | null {
  const t = raw.trim();
  if (!t || t.length > MAX_NAME_AR) return null;
  return t;
}

export function normalizeOptionalBrandNameEn(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const t = String(raw).trim();
  if (t.length > MAX_NAME_EN) return null;
  return t || null;
}

export function normalizeOptionalBrandDescription(
  raw: unknown,
): string | null {
  if (raw == null || raw === "") return null;
  const t = String(raw).trim();
  if (t.length > MAX_DESC) return null;
  return t || null;
}

export function parseBrandDesignerType(raw: unknown): BrandDesignerType | null {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "BRAND" || s === "DESIGNER") return s as BrandDesignerType;
  return null;
}

export function normalizeOptionalBrandLogoUrl(
  raw: unknown,
): { ok: true; value: string | null } | { ok: false } {
  if (raw == null || raw === "") return { ok: true, value: null };
  const s = String(raw).trim();
  if (!isSafeProductImageUrl(s)) return { ok: false };
  return { ok: true, value: s };
}

export function parseBrandSortOrder(raw: unknown): number {
  return clampSortOrder(Number.isFinite(Number(raw)) ? Number(raw) : 0);
}
