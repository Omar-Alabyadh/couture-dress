import type { MediaUsageType } from "@/generated/prisma/client";
import type { MediaAssetDto } from "@/lib/media/types";

export type MediaArchivedFilter = "false" | "true" | "all";

export type MediaUIFilters = {
  usageType: MediaUsageType | "";
  folder: string;
  archived: MediaArchivedFilter;
  q: string;
};

export const DEFAULT_MEDIA_UI_FILTERS: MediaUIFilters = {
  usageType: "",
  folder: "",
  archived: "false",
  q: "",
};

/** Subset returned when an admin form picks a media asset from the library. */
export type MediaPickerSelection = {
  id: string;
  url: string;
  alt: string | null;
  usageType: MediaUsageType;
  folder: string;
};

export function toMediaPickerSelection(
  asset: MediaAssetDto,
): MediaPickerSelection {
  return {
    id: asset.id,
    url: asset.url,
    alt: asset.alt,
    usageType: asset.usageType,
    folder: asset.folder,
  };
}

/** Safely set `heroBgImage` in landing JSON when the editor content parses. */
export function tryInsertLandingHeroBgImage(
  rawJson: string,
  url: string,
): { ok: true; next: string } | { ok: false } {
  try {
    const parsed = JSON.parse(rawJson) as Record<string, unknown>;
    parsed.heroBgImage = url;
    return { ok: true, next: JSON.stringify(parsed, null, 2) };
  } catch {
    return { ok: false };
  }
}

export function createPickerFilters(
  usageType?: MediaUsageType,
  folder?: string,
): MediaUIFilters {
  return {
    usageType: usageType ?? "",
    folder: folder ?? "",
    archived: "false",
    q: "",
  };
}

export const MEDIA_USAGE_OPTIONS: { value: MediaUsageType | ""; label: string }[] =
  [
    { value: "", label: "كل الأنواع" },
    { value: "PRODUCT_IMAGE", label: "صور المنتجات" },
    { value: "BRAND_LOGO", label: "شعارات الماركات" },
    { value: "TESTIMONIAL_AVATAR", label: "صور آراء العملاء" },
    { value: "LANDING_IMAGE", label: "الصفحة الرئيسية" },
    { value: "GENERAL", label: "عام" },
  ];

export const MEDIA_FOLDER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "كل المجلدات" },
  { value: "products", label: "منتجات" },
  { value: "brands", label: "ماركات" },
  { value: "testimonials", label: "آراء العملاء" },
  { value: "landing", label: "الصفحة الرئيسية" },
  { value: "general", label: "عام" },
];

export const MEDIA_ARCHIVED_OPTIONS: { value: MediaArchivedFilter; label: string }[] =
  [
    { value: "false", label: "نشطة" },
    { value: "true", label: "مؤرشفة" },
    { value: "all", label: "الكل" },
  ];

export const MEDIA_UPLOAD_USAGE_OPTIONS = MEDIA_USAGE_OPTIONS.filter(
  (o) => o.value !== "",
) as { value: MediaUsageType; label: string }[];

export function usageTypeLabel(t: MediaUsageType): string {
  return MEDIA_USAGE_OPTIONS.find((o) => o.value === t)?.label ?? t;
}

export function formatMediaBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

export function formatMediaDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function formatMediaDimensions(asset: MediaAssetDto): string {
  if (asset.width && asset.height) {
    return `${asset.width}×${asset.height}`;
  }
  return "—";
}

export function buildMediaListQuery(
  filters: MediaUIFilters,
  cursor?: string | null,
): string {
  const p = new URLSearchParams();
  if (filters.usageType) p.set("usageType", filters.usageType);
  if (filters.folder) p.set("folder", filters.folder);
  p.set("archived", filters.archived);
  const q = filters.q.trim();
  if (q) p.set("q", q);
  p.set("limit", "24");
  if (cursor) p.set("cursor", cursor);
  return `/api/admin/media?${p.toString()}`;
}

export const ACCEPTED_UPLOAD_MIME = "image/jpeg,image/png,image/webp";

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fallback */
    }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
