import type { MediaUsageType } from "@/generated/prisma/client";
import type { MediaAsset } from "@/generated/prisma/client";
import type { MediaAssetDto } from "./types";

const USAGE_TO_FOLDER: Record<MediaUsageType, string> = {
  PRODUCT_IMAGE: "products",
  BRAND_LOGO: "brands",
  TESTIMONIAL_AVATAR: "testimonials",
  LANDING_IMAGE: "landing",
  GENERAL: "general",
};

export function folderForUsageType(usageType: MediaUsageType): string {
  return USAGE_TO_FOLDER[usageType] ?? "general";
}

export function resolveUploadFolder(
  usageType: MediaUsageType,
  folderOverride?: string | null,
): string {
  const custom = folderOverride?.trim();
  if (custom) return custom.replace(/^\/+|\/+$/g, "");
  return folderForUsageType(usageType);
}

function randomSuffix(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return out;
}

/** Storage object path inside the bucket (no leading slash). */
export function buildStoragePath(folder: string, filename: string): string {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safeFolder = folder.replace(/^\/+|\/+$/g, "") || "general";
  const safeName = filename.replace(/[/\\]/g, "").trim() || "file.webp";
  return `${safeFolder}/${yyyy}/${mm}/${Date.now()}-${randomSuffix()}-${safeName}`;
}

export function buildPublicObjectUrl(
  supabaseUrl: string,
  bucket: string,
  path: string,
): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  const key = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${bucket}/${key}`;
}

export type ListCursorPayload = {
  createdAt: string;
  id: string;
};

export function encodeListCursor(createdAt: Date, id: string): string {
  const payload: ListCursorPayload = {
    createdAt: createdAt.toISOString(),
    id,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeListCursor(raw: string | null | undefined): ListCursorPayload | null {
  if (!raw?.trim()) return null;
  try {
    const json = Buffer.from(raw.trim(), "base64url").toString("utf8");
    const parsed = JSON.parse(json) as ListCursorPayload;
    if (!parsed?.createdAt || !parsed?.id) return null;
    const d = new Date(parsed.createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return { createdAt: d.toISOString(), id: String(parsed.id) };
  } catch {
    return null;
  }
}

export function serializeMediaAsset(row: MediaAsset): MediaAssetDto {
  return {
    id: row.id,
    path: row.path,
    url: row.url,
    filename: row.filename,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    width: row.width,
    height: row.height,
    alt: row.alt,
    folder: row.folder,
    usageType: row.usageType,
    provider: row.provider,
    bucket: row.bucket,
    isArchived: row.isArchived,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdById: row.createdById,
  };
}
