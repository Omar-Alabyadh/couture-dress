/**
 * Best-effort in-memory upload rate limit for POST /api/admin/media.
 * On Vercel serverless each instance has its own map — limits are per-instance, not global.
 * Sufficient for light admin abuse protection without Redis/Upstash.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 30;

const uploadTimestampsByUser = new Map<string, number[]>();

export function checkMediaUploadRateLimit(
  userId: string,
): { allowed: true } | { allowed: false } {
  const now = Date.now();
  const prev = uploadTimestampsByUser.get(userId) ?? [];
  const inWindow = prev.filter((t) => now - t < WINDOW_MS);
  if (inWindow.length >= MAX_UPLOADS_PER_WINDOW) {
    uploadTimestampsByUser.set(userId, inWindow);
    return { allowed: false };
  }
  inWindow.push(now);
  uploadTimestampsByUser.set(userId, inWindow);
  return { allowed: true };
}
