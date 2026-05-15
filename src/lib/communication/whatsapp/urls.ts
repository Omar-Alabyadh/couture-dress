/**
 * Build a WhatsApp Web URL (`wa.me`). Pure; safe on server.
 * @param phoneDigits - output of {@link normalizeWhatsappPhone}
 */
export function buildWhatsappUrl(phoneDigits: string, message: string): string {
  const p = phoneDigits.trim();
  const text = message;
  if (!p) return `https://wa.me/?text=${encodeURIComponent(text)}`;
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}
