/** Reusable Arabic fragments — expand for i18n later. */

export const AR_GREETING_COUTURE = "مرحبًا كوتور";

export function arPlaceholderLine(): string {
  return "_______________";
}

export function arProductInquiryModels(shopName: string): string {
  return `مرحباً، أريد الاستفسار عن موديلات ${shopName}.`;
}

/** @deprecated Prefer {@link arProductInquiryModels} — kept for explicit naming. */
export function arDefaultHomeFooterLine(shopName: string): string {
  return arProductInquiryModels(shopName);
}
