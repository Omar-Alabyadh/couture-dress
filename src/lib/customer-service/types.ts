/**
 * Typed view of public customer-service / contact configuration.
 * Source of truth today: `src/lib/config/site.ts`.
 * TODO(Phase-4+): optional admin-managed SiteSetting keys for WhatsApp, hours, branches.
 */

export type CustomerServiceBranch = {
  id: string;
  title: string;
  addressLine: string;
  mapEmbedSrc: string;
  mapOpenUrl?: string;
  mapCenterLat: number;
  mapCenterLng: number;
  mapPreviewImage?: string;
};

export type CustomerServiceConfig = {
  shopName: string;
  /** Digits only, suitable for `wa.me/{digits}` (no `+`). */
  whatsappWaMeDigits: string;
  /** Display phone (may include `+`). */
  phoneDisplay: string;
  branches: CustomerServiceBranch[];
};
