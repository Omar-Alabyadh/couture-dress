export type {
  ContactWhatsappContext,
  CustomDesignPlaceholderContext,
  CustomerServiceWhatsappContext,
  ProductInquiryWhatsappContext,
  ProductWhatsappContext,
  WhatsappTemplateKind,
} from "./types";
export { normalizeWhatsappPhone } from "./phone";
export { buildWhatsappUrl } from "./urls";
export {
  buildDefaultHomeFooterWhatsappMessage,
  buildProductWhatsappBody,
  buildWhatsappMessage,
} from "./builders";
export { buildSiteWhatsappUrl } from "./site-links";
export {
  AR_GREETING_COUTURE,
  arDefaultHomeFooterLine,
  arPlaceholderLine,
  arProductInquiryModels,
} from "./templates";
