/** عرض السعر في الواجهة (بطاقة) */
export function formatProductPriceDisplay(
  price: string | null,
  currency: string,
): string {
  if (price == null || price === "") return "تواصلي لمعرفة السعر";
  const c = (currency || "LYD").toUpperCase();
  if (c === "LYD") return `${price} د.ل`;
  return `${price} ${c}`;
}

/** سطر السعر في رسالة واتساب */
export function formatProductPriceForWhatsapp(
  price: string | null,
  currency: string,
): string {
  if (price == null || price === "") return "تواصلي لمعرفة السعر";
  const c = (currency || "LYD").toUpperCase();
  if (c === "LYD") return `${price} د.ل`;
  return `${price} ${c}`;
}
