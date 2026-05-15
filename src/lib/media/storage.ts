import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class MediaStorageConfigError extends Error {
  constructor(message = "إعدادات Supabase Storage غير مكتملة.") {
    super(message);
    this.name = "MediaStorageConfigError";
  }
}

export function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) throw new MediaStorageConfigError();
  return url.replace(/\/+$/, "");
}

export function getStorageBucket(): string {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  if (!bucket) throw new MediaStorageConfigError();
  return bucket;
}

/** Server-only Supabase client with service role — never import from client components. */
export function createSupabaseServiceClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new MediaStorageConfigError(
      "SUPABASE_SERVICE_ROLE_KEY مطلوب على الخادم فقط.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function uploadObjectToStorage(params: {
  path: string;
  buffer: Buffer;
  mimeType: string;
  cacheControl?: string;
}): Promise<void> {
  const bucket = getStorageBucket();
  const client = createSupabaseServiceClient();
  const { error } = await client.storage.from(bucket).upload(params.path, params.buffer, {
    contentType: params.mimeType,
    cacheControl: params.cacheControl ?? "public, max-age=31536000, immutable",
    upsert: false,
  });
  if (error) {
    throw new Error(error.message || "تعذر رفع الملف إلى التخزين.");
  }
}

/** Best-effort cleanup when DB insert fails after upload. */
export async function removeObjectFromStorage(path: string): Promise<void> {
  const bucket = getStorageBucket();
  const client = createSupabaseServiceClient();
  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) {
    console.error("[media] removeObjectFromStorage:", error.message);
  }
}
