/**
 * Normalize a phone string for `wa.me/{digits}` (no `+`, spaces, or separators).
 * Supports Libya +218… and numbers already stored as digits-only.
 */
export function normalizeWhatsappPhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  return digits;
}
