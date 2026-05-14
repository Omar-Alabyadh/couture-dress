import { formatProductPriceForWhatsapp } from "@/lib/product-price";

/**
 * رسالة طلب منتج لواتساب — تُرمَّز لاحقًا عبر buildWhatsappLink.
 */
export function buildProductOrderWhatsappMessage(input: {
  productName: string;
  price: string | null;
  currency: string;
}): string {
  const priceLine = formatProductPriceForWhatsapp(input.price, input.currency);
  return [
    "مرحبًا كوتور ✨",
    "",
    "أريد طلب المنتج التالي:",
    "",
    `المنتج: ${input.productName}`,
    `السعر: ${priceLine}`,
    "",
    "المقاس المطلوب: _______________",
    "اللون المطلوب: _______________",
    "",
    "وأريد معرفة تفاصيل التوصيل 🚚",
  ].join("\n");
}
