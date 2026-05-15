import type { MediaUsageType } from "@/generated/prisma/client";
import { MediaProvider } from "@/generated/prisma/client";
import {
  ImageProcessError,
  buildPublicObjectUrl,
  buildStoragePath,
  encodeListCursor,
  getStorageBucket,
  getSupabaseUrl,
  processImageForUpload,
  removeObjectFromStorage,
  resolveUploadFolder,
  serializeMediaAsset,
  uploadObjectToStorage,
} from "@/lib/media";
import type { MediaListFilters, MediaListResult, MediaUpdateInput } from "@/lib/media/types";
import {
  clampListLimit,
  normalizeFolderSegment,
  normalizeOptionalAlt,
  parseArchivedFilter,
  parseMediaUsageType,
  sanitizeOriginalFilename,
  validateUploadFile,
} from "@/lib/media/validation";
import {
  createMediaAsset,
  findMediaAssetById,
  listMediaAssets,
  updateMediaAsset,
} from "@/server/repositories/mediaRepository";

export function parseMediaListFilters(
  searchParams: URLSearchParams,
): MediaListFilters {
  const usageRaw = searchParams.get("usageType");
  const usageType = usageRaw ? parseMediaUsageType(usageRaw) : undefined;
  const folderRaw = searchParams.get("folder");
  const folder = folderRaw ? normalizeFolderSegment(folderRaw) ?? undefined : undefined;

  return {
    folder: folder ?? undefined,
    usageType: usageType ?? undefined,
    archived: parseArchivedFilter(searchParams.get("archived")),
    q: searchParams.get("q")?.trim() || undefined,
    limit: clampListLimit(searchParams.get("limit")),
    cursor: searchParams.get("cursor")?.trim() || undefined,
  };
}

export async function listMediaForAdmin(
  filters: MediaListFilters,
): Promise<MediaListResult> {
  const limit = filters.limit ?? 24;
  const { rows, hasMore } = await listMediaAssets({
    folder: filters.folder,
    usageType: filters.usageType,
    archived: filters.archived ?? "false",
    q: filters.q,
    limit,
    cursor: filters.cursor,
  });

  const data = rows.map(serializeMediaAsset);
  const last = rows[rows.length - 1];
  const nextCursor =
    hasMore && last ? encodeListCursor(last.createdAt, last.id) : null;

  return { data, nextCursor };
}

export async function uploadMediaForAdmin(params: {
  file: File;
  buffer: Buffer;
  usageType?: MediaUsageType | null;
  folder?: string | null;
  alt?: string | null;
  createdById: string;
}) {
  const validated = validateUploadFile(params.file, params.buffer);
  if (!validated.ok) {
    throw new MediaServiceError("VALIDATION", validated.error);
  }

  const usageType = params.usageType ?? "GENERAL";
  const folder = resolveUploadFolder(
    usageType,
    params.folder ? normalizeFolderSegment(params.folder) : null,
  );
  const originalFilename = sanitizeOriginalFilename(
    params.file.name || "upload",
  );

  let processed;
  try {
    processed = await processImageForUpload(
      validated.buffer,
      usageType,
      originalFilename,
    );
  } catch (e) {
    if (e instanceof ImageProcessError) {
      throw new MediaServiceError("VALIDATION", e.message);
    }
    throw e;
  }

  const path = buildStoragePath(folder, processed.filename);
  const bucket = getStorageBucket();

  try {
    await uploadObjectToStorage({
      path,
      buffer: processed.buffer,
      mimeType: processed.mimeType,
    });
  } catch (e) {
    throw new MediaServiceError(
      "STORAGE",
      e instanceof Error ? e.message : "تعذر الرفع.",
    );
  }

  const url = buildPublicObjectUrl(getSupabaseUrl(), bucket, path);

  try {
    const row = await createMediaAsset({
      path,
      url,
      filename: processed.filename,
      originalFilename,
      mimeType: processed.mimeType,
      sizeBytes: processed.sizeBytes,
      width: processed.width,
      height: processed.height,
      alt: normalizeOptionalAlt(params.alt),
      folder,
      usageType,
      provider: MediaProvider.SUPABASE_STORAGE,
      bucket,
      isArchived: false,
      createdBy: { connect: { id: params.createdById } },
    });
    return serializeMediaAsset(row);
  } catch (e) {
    await removeObjectFromStorage(path);
    throw e;
  }
}

export async function updateMediaForAdmin(
  id: string,
  input: MediaUpdateInput,
) {
  const existing = await findMediaAssetById(id);
  if (!existing) {
    throw new MediaServiceError("NOT_FOUND", "الوسيط غير موجود.");
  }

  const data: {
    alt?: string | null;
    folder?: string;
    usageType?: MediaUsageType;
    isArchived?: boolean;
  } = {};

  if (input.alt !== undefined) {
    data.alt = normalizeOptionalAlt(input.alt);
  }
  if (input.folder !== undefined) {
    const f = normalizeFolderSegment(input.folder);
    if (!f) throw new MediaServiceError("VALIDATION", "مجلد غير صالح.");
    data.folder = f;
  }
  if (input.usageType !== undefined) {
    const u = parseMediaUsageType(input.usageType);
    if (!u) throw new MediaServiceError("VALIDATION", "نوع الاستخدام غير صالح.");
    data.usageType = u;
  }
  if (input.isArchived !== undefined) {
    data.isArchived = Boolean(input.isArchived);
  }

  if (Object.keys(data).length === 0) {
    throw new MediaServiceError("VALIDATION", "لا حقول للتحديث.");
  }

  const row = await updateMediaAsset(id, data);
  return serializeMediaAsset(row);
}

export async function archiveMediaForAdmin(id: string) {
  return updateMediaForAdmin(id, { isArchived: true });
}

export class MediaServiceError extends Error {
  code: "VALIDATION" | "NOT_FOUND" | "STORAGE";
  constructor(code: MediaServiceError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "MediaServiceError";
  }
}

export function mediaServiceErrorStatus(
  code: MediaServiceError["code"],
): number {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "VALIDATION":
      return 400;
    case "STORAGE":
      return 502;
    default:
      return 500;
  }
}
