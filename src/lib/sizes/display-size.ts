/** Public-facing size label (Arabic storefront). */
export function formatPublicSizeLabel(size: string | null | undefined): string {
  const t = (size ?? "").trim();
  if (!t) return "مقاس واحد";
  if (t.toLowerCase() === "standard") return "مقاس واحد";
  return t;
}
