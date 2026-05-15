/** First grapheme(s) from Arabic/Latin name parts — for avatar/monogram fallbacks. */
export function nameInitials(name: string, parts = 2): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "؟";
  const take = tokens.slice(0, Math.max(1, parts));
  return take
    .map((t) => [...t][0] ?? "")
    .join("")
    .slice(0, parts);
}
