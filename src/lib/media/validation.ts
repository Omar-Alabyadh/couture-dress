import type { MediaUsageType } from "@/generated/prisma/client";

/** 5 MB — safe for Vercel Hobby request limits. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_INPUT_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const REJECTED_MIME = new Set([
  "image/svg+xml",
  "image/gif",
  "image/svg",
]);

const MAX_ALT = 500;
const MAX_ORIGINAL_FILENAME = 255;
const MAX_FOLDER_SEGMENT = 64;

export type SniffedImageKind = "jpeg" | "png" | "webp";

export function sniffImageKind(buffer: Buffer): SniffedImageKind | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function mimeMatchesSniff(declared: string, sniffed: SniffedImageKind): boolean {
  const d = declared.toLowerCase();
  if (sniffed === "jpeg") return d === "image/jpeg" || d === "image/jpg";
  if (sniffed === "png") return d === "image/png";
  if (sniffed === "webp") return d === "image/webp";
  return false;
}

export type UploadValidationResult =
  | { ok: true; buffer: Buffer; declaredMime: string; sniffed: SniffedImageKind }
  | { ok: false; error: string };

export function validateUploadFile(
  file: File,
  buffer: Buffer,
): UploadValidationResult {
  if (!file || !(file instanceof File)) {
    return { ok: false, error: "ملف غير صالح." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "الملف فارغ." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "حجم الملف يتجاوز الحد المسموح (5 ميجابايت)." };
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "حجم الملف يتجاوز الحد المسموح." };
  }

  const declared = (file.type || "").toLowerCase().trim();
  if (REJECTED_MIME.has(declared)) {
    return { ok: false, error: "نوع الملف غير مدعوم (SVG/GIF)." };
  }
  if (!ALLOWED_INPUT_MIME.has(declared)) {
    return { ok: false, error: "نوع الملف غير مدعوم. استخدمي JPEG أو PNG أو WebP." };
  }

  const sniffed = sniffImageKind(buffer);
  if (!sniffed) {
    return { ok: false, error: "تعذر التحقق من صيغة الصورة." };
  }
  if (!mimeMatchesSniff(declared, sniffed)) {
    return { ok: false, error: "نوع الملف المعلن لا يطابق محتوى الصورة." };
  }

  return { ok: true, buffer, declaredMime: declared, sniffed };
}

export function sanitizeOriginalFilename(name: string): string {
  const base = name
    .replace(/[/\\]/g, "")
    .replace(/[^\w.\-()\s\u0600-\u06FF]/g, "")
    .trim()
    .slice(0, MAX_ORIGINAL_FILENAME);
  return base || "upload";
}

export function normalizeOptionalAlt(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const t = String(raw).trim();
  if (!t) return null;
  return t.slice(0, MAX_ALT);
}

export function normalizeFolderSegment(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const t = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, MAX_FOLDER_SEGMENT);
  return t || null;
}

const USAGE_TYPES = new Set<string>([
  "PRODUCT_IMAGE",
  "BRAND_LOGO",
  "TESTIMONIAL_AVATAR",
  "LANDING_IMAGE",
  "GENERAL",
]);

export function parseMediaUsageType(raw: unknown): MediaUsageType | null {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!USAGE_TYPES.has(s)) return null;
  return s as MediaUsageType;
}

export function parseArchivedFilter(
  raw: string | null,
): "false" | "true" | "all" {
  const v = (raw ?? "false").trim().toLowerCase();
  if (v === "true" || v === "all") return v;
  return "false";
}

export function clampListLimit(raw: string | null): number {
  const n = Number(raw ?? 24);
  if (!Number.isFinite(n)) return 24;
  return Math.max(1, Math.min(48, Math.floor(n)));
}
