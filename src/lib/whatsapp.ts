import { siteConfig } from "@/lib/config/site";

export function buildWhatsappLink(message: string): string {
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
