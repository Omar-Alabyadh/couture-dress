import { getWhatsappWaMeDigits } from "@/lib/customer-service/selectors";
import { buildWhatsappUrl } from "./urls";

/** Full WhatsApp URL for the site default business number. */
export function buildSiteWhatsappUrl(message: string): string {
  return buildWhatsappUrl(getWhatsappWaMeDigits(), message);
}
