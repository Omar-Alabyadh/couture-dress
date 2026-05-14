import { formatProductPriceForWhatsapp } from "@/lib/product-price";

/**
 * Context for building a WhatsApp product inquiry (Phase 4 will replace with DB templates).
 */
export type ProductOrderWhatsappContext = {
  productName: string;
  price: string | null;
  currency: string;
  /** Filled when the shopper picked a variant / size */
  selectedSize?: string | null;
  selectedColorLabel?: string | null;
  /** When requesting an out-of-stock size that allows special order */
  specialOrderMode?: boolean;
  /** Picked size exists but is not sellable and special order is off */
  unavailableNoSpecial?: boolean;
};

/**
 * رسالة طلب منتج لواتساب — تُرمَّز لاحقًا عبر buildWhatsappLink.
 * (Phase 4: centralize copy in configurable templates.)
 */
export function buildProductOrderWhatsappMessage(
  input: ProductOrderWhatsappContext,
): string {
  const priceLine = formatProductPriceForWhatsapp(input.price, input.currency);
  const sizeLine =
    input.selectedSize?.trim() ||
    "_______________";
  const colorLine =
    input.selectedColorLabel?.trim() ||
    "_______________";

  if (input.specialOrderMode) {
    return [
      "مرحبًا كوتور ✨",
      "",
      "أريد طلبًا خاصًا (مقاس غير متوفر حاليًا لكن مسموح بطلب خاص):",
      "",
      `المنتج: ${input.productName}`,
      `السعر: ${priceLine}`,
      `المقاس المطلوب: ${sizeLine}`,
      `اللون: ${colorLine}`,
      "",
      "يرجى تأكيد إمكانية التنفيذ والمدة 🙏",
    ].join("\n");
  }

  if (input.unavailableNoSpecial) {
    return [
      "مرحبًا كوتور ✨",
      "",
      "أود الاستفسار عن المنتج التالي (مقاس غير متوفر حاليًا للطلب العادي):",
      "",
      `المنتج: ${input.productName}`,
      `السعر: ${priceLine}`,
      `المقاس: ${sizeLine}`,
      `اللون: ${colorLine}`,
      "",
      "هل يتوفر لاحقًا أو هناك بديل مقترح؟",
    ].join("\n");
  }

  return [
    "مرحبًا كوتور ✨",
    "",
    "أريد طلب المنتج التالي:",
    "",
    `المنتج: ${input.productName}`,
    `السعر: ${priceLine}`,
    "",
    `المقاس المطلوب: ${sizeLine}`,
    `اللون المطلوب: ${colorLine}`,
    "",
    "وأريد معرفة تفاصيل التوصيل 🚚",
  ].join("\n");
}
