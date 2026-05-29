/**
 * WhatsApp template identifiers (Arabic copy today; i18n-ready structure later).
 */
export type WhatsappTemplateKind =
  | "product_inquiry"
  | "product_order"
  | "unavailable_size_inquiry"
  | "special_order"
  | "contact_inquiry"
  | "customer_service"
  | "custom_design_request_placeholder";

/** Product card / order flow (size, color, special-order flags). */
export type ProductWhatsappContext = {
  productTitle: string;
  price: string | null;
  currency: string;
  /** Active discount percentage (1–100) when the product is on offer. */
  discountPercent?: number | null;
  /** Pre-discount price string when the product is on offer. */
  originalPrice?: string | null;
  selectedSize?: string | null;
  selectedColorLabel?: string | null;
  specialOrderMode?: boolean;
  unavailableNoSpecial?: boolean;
  customerName?: string | null;
  customerPhone?: string | null;
  customerNote?: string | null;
};

export type ProductInquiryWhatsappContext = {
  shopName: string;
};

/** Home contact form → WhatsApp. */
export type ContactWhatsappContext = {
  shopName: string;
  name: string;
  phone: string;
  message: string;
  branch?: string | null;
};

/** Generic one-off customer line (footer default, etc.). */
export type CustomerServiceWhatsappContext = {
  shopName: string;
  messageLine: string;
  branch?: string | null;
  /** For analytics / future admin; not appended to Arabic body in Phase 4. */
  source?: string | null;
};

/** Reserved for future “تصميم مخصص” UI — placeholder copy only. */
export type CustomDesignPlaceholderContext = {
  shopName: string;
  branch?: string | null;
};
