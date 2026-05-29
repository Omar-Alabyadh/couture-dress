const MAX_TITLE_AR = 280;
const MAX_TITLE_EN = 280;
const MAX_DESCRIPTION = 12000;
const MAX_IMAGE_URL = 2048;
const MAX_SIZES = 40;
const MAX_SIZE_TOKEN_LEN = 32;
const MAX_COLOR_IDS = 60;
export const MAX_PRODUCT_IMAGES = 24;
export const MAX_IMAGE_ALT = 500;

export type ProductImageInputRow = {
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
};

export function isSafeProductImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t || t.length > MAX_IMAGE_URL) return false;
  if (/[\x00-\x1f\x7f<>]/.test(t)) return false;
  if (t.startsWith("//")) return false;
  if (t.startsWith("/")) {
    if (t.includes("..")) return false;
    return true;
  }
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeProductSizes(sizes: string[]): string[] | null {
  if (sizes.length > MAX_SIZES) return null;
  const out: string[] = [];
  for (const s of sizes) {
    const t = s.trim();
    if (!t || t.length > MAX_SIZE_TOKEN_LEN) return null;
    out.push(t);
  }
  return out;
}

export function normalizeColorIds(ids: string[]): string[] | null {
  if (ids.length > MAX_COLOR_IDS) return null;
  return ids.map((id) => id.trim()).filter(Boolean);
}

export function parseOptionalPrice(
  value: unknown,
): string | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  const s =
    typeof value === "number"
      ? String(value)
      : String(value).trim().replace(",", ".");
  if (!s) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return "invalid";
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0 || n > 99999999.99) return "invalid";
  return s;
}

/**
 * Validate a discount percentage from request input.
 * Returns an integer in [0, 100], or "invalid" for out-of-range / non-numeric.
 * Empty / null / undefined is treated as 0 (no discount).
 */
export function parseDiscountPercent(value: unknown): number | "invalid" {
  if (value === null || value === undefined || value === "") return 0;
  const raw =
    typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(raw)) return "invalid";
  if (!Number.isInteger(raw)) {
    if (Math.trunc(raw) !== raw) return "invalid";
  }
  const i = Math.trunc(raw);
  if (i < 0 || i > 100) return "invalid";
  return i;
}

export function parseCurrency(value: unknown, fallback = "LYD"): string {
  const t = String(value ?? "").trim().toUpperCase();
  if (!t) return fallback;
  if (t.length > 8) return fallback;
  if (!/^[A-Z0-9]{2,8}$/.test(t)) return fallback;
  return t;
}

/** صفوف جاهزة لـ Prisma createMany — صورة أساسية واحدة بالضبط */
export function normalizeProductImagesForSave(
  imagesRaw: unknown,
  legacyUrl: string,
  legacyAlt: string,
):
  | { ok: true; rows: { url: string; alt: string | null; isPrimary: boolean; sortOrder: number }[] }
  | { ok: false } {
  const legacy = legacyUrl.trim();
  if (!isSafeProductImageUrl(legacy)) return { ok: false };

  let candidates: ProductImageInputRow[] = [];
  if (Array.isArray(imagesRaw) && imagesRaw.length > 0) {
    if (imagesRaw.length > MAX_PRODUCT_IMAGES) return { ok: false };
    for (const raw of imagesRaw) {
      if (!raw || typeof raw !== "object") return { ok: false };
      const o = raw as Record<string, unknown>;
      const url = String(o.url ?? "").trim();
      if (!isSafeProductImageUrl(url)) return { ok: false };
      const altRaw = o.alt != null ? String(o.alt) : null;
      const alt =
        altRaw && altRaw.trim()
          ? altRaw.trim().slice(0, MAX_IMAGE_ALT)
          : null;
      candidates.push({
        url,
        alt,
        isPrimary: Boolean(o.isPrimary),
        sortOrder:
          typeof o.sortOrder === "number" && Number.isFinite(o.sortOrder)
            ? Math.trunc(o.sortOrder)
            : 0,
      });
    }
  } else {
    candidates = [
      {
        url: legacy,
        alt: legacyAlt.trim() ? legacyAlt.trim().slice(0, MAX_IMAGE_ALT) : null,
        isPrimary: true,
        sortOrder: 0,
      },
    ];
  }

  candidates = candidates.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const primaryIdx = Math.max(
    0,
    candidates.findIndex((c) => c.isPrimary) >= 0
      ? candidates.findIndex((c) => c.isPrimary)
      : 0,
  );
  const rows = candidates.map((c, i) => ({
    url: c.url,
    alt: c.alt ?? null,
    isPrimary: i === primaryIdx,
    sortOrder: i,
  }));
  return { ok: true, rows };
}

export function isValidTitleAr(s: string): boolean {
  const t = s.trim();
  return t.length > 0 && t.length <= MAX_TITLE_AR;
}

export function isValidOptionalTitleEn(s: string | null | undefined): boolean {
  if (s == null || s === "") return true;
  return s.length <= MAX_TITLE_EN;
}

export function isValidOptionalDescription(
  s: string | null | undefined,
): boolean {
  if (s == null || s === "") return true;
  return s.length <= MAX_DESCRIPTION;
}

export const MAX_VARIANTS = 60;

export type NormalizedProductVariantInput = {
  size: string;
  colorId: string | null;
  colorLabel: string | null;
  quantity: number;
  isAvailable: boolean;
  allowSpecialOrder: boolean;
  sortOrder: number;
};

/**
 * Legacy `sizes` synced from variants: unique sizes (trimmed) that are in stock
 * (available flag + positive quantity), preserving first-seen order by sortOrder.
 */
export function legacySizesFromNormalizedVariants(
  rows: NormalizedProductVariantInput[],
): string[] {
  const sorted = [...rows].map((r, i) => ({ ...r, _i: i }));
  sorted.sort((a, b) => {
      const oa = a.sortOrder ?? a._i;
      const ob = b.sortOrder ?? b._i;
      return oa - ob || a._i - b._i;
    });
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of sorted) {
    if (!r.isAvailable || r.quantity <= 0) continue;
    const s = r.size.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function sortOrderFromIndex(i: number): number {
  return i;
}

/**
 * Parse and validate variant rows from admin JSON.
 * Enforces unique (size trimmed lower, colorId|null) per product.
 */
export function normalizeProductVariantsInput(
  raw: unknown,
): { ok: true; rows: NormalizedProductVariantInput[] } | { ok: false } {
  if (!Array.isArray(raw)) return { ok: false };
  if (raw.length > MAX_VARIANTS) return { ok: false };
  const rows: NormalizedProductVariantInput[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") return { ok: false };
    const o = item as Record<string, unknown>;
    let size = String(o.size ?? "").trim();
    if (!size) size = "Standard";
    if (size.length > MAX_SIZE_TOKEN_LEN) return { ok: false };
    let colorId: string | null = null;
    if (o.colorId != null && o.colorId !== "") {
      const c = String(o.colorId).trim();
      if (!c) return { ok: false };
      colorId = c;
    }
    let colorLabel: string | null = null;
    if (o.colorLabel != null && o.colorLabel !== "") {
      const label = String(o.colorLabel).trim().slice(0, 80);
      if (label) colorLabel = label;
    }
    const qRaw = o.quantity;
    const quantity =
      typeof qRaw === "number" && Number.isFinite(qRaw)
        ? Math.trunc(qRaw)
        : parseInt(String(qRaw ?? "0"), 10);
    if (!Number.isFinite(quantity) || quantity < 0 || quantity > 999_999) {
      return { ok: false };
    }
    let isAvailable = Boolean(o.isAvailable);
    const allowSpecialOrder = Boolean(o.allowSpecialOrder);
    if (quantity <= 0) isAvailable = false;
    const key = `${size.toLowerCase()}__${colorId ?? colorLabel?.toLowerCase() ?? ""}`;
    if (seen.has(key)) return { ok: false };
    seen.add(key);
    rows.push({
      size,
      colorId,
      colorLabel,
      quantity,
      isAvailable,
      allowSpecialOrder,
      sortOrder: sortOrderFromIndex(rows.length),
    });
  }
  return { ok: true, rows };
}
