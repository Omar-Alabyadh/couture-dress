/** Hero background: same-origin path or absolute http(s) URL; blocks obvious injection in CSS url(). */
export function clampHeroBgImageUrl(input: string, fallback: string): string {
  const t = input.trim();
  if (!t || t.length > 800) return fallback;
  if (/[\x00-\x1f\x7f<>]/.test(t)) return fallback;
  if (t.startsWith("//")) return fallback;
  if (t.startsWith("/")) {
    if (t.includes("..")) return fallback;
    return t;
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "https:" && u.protocol !== "http:") return fallback;
    return t;
  } catch {
    return fallback;
  }
}
