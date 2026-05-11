const MAX_TITLE_AR = 280;
const MAX_TITLE_EN = 280;
const MAX_DESCRIPTION = 12000;
const MAX_IMAGE_URL = 2048;
const MAX_SIZES = 40;
const MAX_SIZE_TOKEN_LEN = 32;
const MAX_COLOR_IDS = 60;

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
