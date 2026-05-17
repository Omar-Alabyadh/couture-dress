/** Normalize media URLs for equality checks (trim, no trailing slashes). */
export function normalizeMediaUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}
