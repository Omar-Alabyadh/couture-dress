import { formatProductPriceForWhatsapp } from "@/lib/product-price";
import type {
  ContactWhatsappContext,
  CustomDesignPlaceholderContext,
  CustomerServiceWhatsappContext,
  ProductInquiryWhatsappContext,
  ProductWhatsappContext,
  WhatsappTemplateKind,
} from "./types";
import {
  AR_GREETING_COUTURE,
  arDefaultHomeFooterLine,
  arPlaceholderLine,
  arProductInquiryModels,
} from "./templates";

function joinMessage(lines: (string | null | undefined | false)[]): string {
  return lines
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .join("\n");
}

function sizeColorLines(ctx: ProductWhatsappContext): { size: string; color: string } {
  return {
    size: ctx.selectedSize?.trim() || arPlaceholderLine(),
    color: ctx.selectedColorLabel?.trim() || arPlaceholderLine(),
  };
}

function optionalCustomerBlock(ctx: ProductWhatsappContext): string[] {
  const n = ctx.customerName?.trim();
  const ph = ctx.customerPhone?.trim();
  const note = ctx.customerNote?.trim();
  const lines: string[] = [];
  if (n) lines.push(`اسم العميلة: ${n}`);
  if (ph) lines.push(`الهاتف: ${ph}`);
  if (note) lines.push(`ملاحظة: ${note}`);
  return lines;
}

/** Build the price line, appending the active offer note when present. */
function productPriceLine(ctx: ProductWhatsappContext): string {
  const finalLine = formatProductPriceForWhatsapp(ctx.price, ctx.currency);
  const hasOffer =
    typeof ctx.discountPercent === "number" &&
    ctx.discountPercent > 0 &&
    Boolean(ctx.originalPrice);
  if (!hasOffer) return finalLine;
  const oldLine = formatProductPriceForWhatsapp(
    ctx.originalPrice ?? null,
    ctx.currency,
  );
  return `${finalLine} (بعد خصم ${ctx.discountPercent}% — بدلاً من ${oldLine})`;
}

/** Body text for product order / special / unavailable flows (Arabic). */
export function buildProductWhatsappBody(ctx: ProductWhatsappContext): string {
  const priceLine = productPriceLine(ctx);
  const { size, color } = sizeColorLines(ctx);
  const extra = optionalCustomerBlock(ctx);

  if (ctx.specialOrderMode) {
    return joinMessage([
      AR_GREETING_COUTURE,
      "",
      "أريد طلبًا خاصًا (مقاس غير متوفر حاليًا لكن مسموح بطلب خاص):",
      "",
      `المنتج: ${ctx.productTitle}`,
      `السعر: ${priceLine}`,
      `المقاس المطلوب: ${size}`,
      `اللون: ${color}`,
      "",
      "يرجى تأكيد إمكانية التنفيذ والمدة.",
      ...extra,
    ]);
  }

  if (ctx.unavailableNoSpecial) {
    return joinMessage([
      AR_GREETING_COUTURE,
      "",
      "أود الاستفسار عن المنتج التالي (مقاس غير متوفر حاليًا للطلب العادي):",
      "",
      `المنتج: ${ctx.productTitle}`,
      `السعر: ${priceLine}`,
      `المقاس: ${size}`,
      `اللون: ${color}`,
      "",
      "هل يتوفر لاحقًا أو هناك بديل مقترح؟",
      ...extra,
    ]);
  }

  return joinMessage([
    AR_GREETING_COUTURE,
    "",
    "أريد طلب المنتج التالي:",
    "",
    `المنتج: ${ctx.productTitle}`,
    `السعر: ${priceLine}`,
    "",
    `المقاس المطلوب: ${size}`,
    `اللون المطلوب: ${color}`,
    "",
    "وأريد معرفة تفاصيل التوصيل.",
    ...extra,
  ]);
}

export function buildWhatsappMessage(
  kind: WhatsappTemplateKind,
  ctx:
    | ProductWhatsappContext
    | ProductInquiryWhatsappContext
    | ContactWhatsappContext
    | CustomerServiceWhatsappContext
    | CustomDesignPlaceholderContext,
): string {
  switch (kind) {
    case "product_inquiry": {
      const c = ctx as ProductInquiryWhatsappContext;
      return arProductInquiryModels(c.shopName);
    }
    case "product_order":
    case "unavailable_size_inquiry":
    case "special_order":
      return buildProductWhatsappBody(ctx as ProductWhatsappContext);
    case "contact_inquiry": {
      const c = ctx as ContactWhatsappContext;
      return joinMessage([
        `مرحباً، هذه رسالة من موقع ${c.shopName}:`,
        c.branch ? `الفرع: ${c.branch}` : "",
        `الاسم: ${c.name}`,
        `الهاتف: ${c.phone}`,
        `الرسالة: ${c.message}`,
      ]);
    }
    case "customer_service": {
      const c = ctx as CustomerServiceWhatsappContext;
      return joinMessage([
        c.branch ? `الفرع: ${c.branch}` : "",
        c.messageLine,
      ]);
    }
    case "custom_design_request_placeholder": {
      const c = ctx as CustomDesignPlaceholderContext;
      return joinMessage([
        AR_GREETING_COUTURE,
        "",
        "أود الاستفسار عن تصميم مخصّص (تفاصيل إضافية لاحقًا من صفحة مخصصة).",
        `المتجر: ${c.shopName}`,
        c.branch ? `الفرع المفضّل: ${c.branch}` : "",
        "",
        "— نموذج مبدئي —",
      ]);
    }
  }
}

/** Default WhatsApp line for home footer / generic tap (matches legacy copy). */
export function buildDefaultHomeFooterWhatsappMessage(shopName: string): string {
  return arDefaultHomeFooterLine(shopName);
}
