import { siteBranches, siteConfig } from "@/lib/config/site";
import { normalizeWhatsappPhone } from "@/lib/communication/whatsapp/phone";
import type { CustomerServiceBranch, CustomerServiceConfig } from "./types";

function mapBranch(b: (typeof siteBranches)[number]): CustomerServiceBranch {
  return {
    id: b.id,
    title: b.title,
    addressLine: b.addressLine,
    mapEmbedSrc: b.mapEmbedSrc,
    mapOpenUrl: b.mapOpenUrl,
    mapCenterLat: b.mapCenterLat,
    mapCenterLng: b.mapCenterLng,
    mapPreviewImage: b.mapPreviewImage,
  };
}

/** Normalized public customer-service snapshot (no secrets; safe for client bundles). */
export function getCustomerServiceConfig(): CustomerServiceConfig {
  return {
    shopName: siteConfig.shopName,
    whatsappWaMeDigits: normalizeWhatsappPhone(siteConfig.whatsappNumber),
    phoneDisplay: siteConfig.phone,
    branches: siteBranches.map(mapBranch),
  };
}
