import { LANDING_SETTING_KEY } from "@/lib/types/landing";
import { normalizeMediaUrl } from "@/lib/media/normalize-url";
import { findMediaAssetById } from "@/server/repositories/mediaRepository";
import { prisma } from "@/server/db/client";

export type MediaUsageReferenceType =
  | "PRODUCT"
  | "BRAND"
  | "TESTIMONIAL"
  | "LANDING";

export type MediaUsageReference = {
  type: MediaUsageReferenceType;
  label: string;
  field: string;
  entityId?: string;
};

export type MediaUsageScanResult = {
  mediaAssetId: string;
  totalReferences: number;
  references: MediaUsageReference[];
};

function urlMatches(stored: string | null | undefined, target: string): boolean {
  if (!stored?.trim()) return false;
  return normalizeMediaUrl(stored) === target;
}

export async function scanMediaAssetUsage(
  mediaAssetId: string,
): Promise<MediaUsageScanResult | null> {
  const asset = await findMediaAssetById(mediaAssetId);
  if (!asset) return null;

  const target = normalizeMediaUrl(asset.url);
  const references: MediaUsageReference[] = [];

  const [productImages, collectionItems, brands, testimonials, landingRow] =
    await Promise.all([
      prisma.productImage.findMany({
        where: { collectionItem: { deletedAt: null } },
        select: {
          url: true,
          collectionItem: { select: { id: true, titleAr: true } },
        },
      }),
      prisma.collectionItem.findMany({
        where: { deletedAt: null },
        select: { id: true, titleAr: true, imageUrl: true },
      }),
      prisma.brandDesigner.findMany({
        where: { deletedAt: null },
        select: { id: true, nameAr: true, logoUrl: true },
      }),
      prisma.testimonial.findMany({
        where: { deletedAt: null },
        select: { id: true, customerName: true, imageUrl: true },
      }),
      prisma.siteSetting.findUnique({
        where: { key: LANDING_SETTING_KEY },
        select: { value: true },
      }),
    ]);

  for (const pi of productImages) {
    if (urlMatches(pi.url, target)) {
      references.push({
        type: "PRODUCT",
        label: pi.collectionItem.titleAr,
        field: "ProductImage.url",
        entityId: pi.collectionItem.id,
      });
    }
  }

  for (const item of collectionItems) {
    if (urlMatches(item.imageUrl, target)) {
      references.push({
        type: "PRODUCT",
        label: item.titleAr,
        field: "CollectionItem.imageUrl",
        entityId: item.id,
      });
    }
  }

  for (const b of brands) {
    if (urlMatches(b.logoUrl, target)) {
      references.push({
        type: "BRAND",
        label: b.nameAr,
        field: "BrandDesigner.logoUrl",
        entityId: b.id,
      });
    }
  }

  for (const t of testimonials) {
    if (urlMatches(t.imageUrl, target)) {
      references.push({
        type: "TESTIMONIAL",
        label: t.customerName,
        field: "Testimonial.imageUrl",
        entityId: t.id,
      });
    }
  }

  if (landingRow?.value) {
    try {
      const parsed = JSON.parse(landingRow.value) as { heroBgImage?: unknown };
      const hero =
        typeof parsed.heroBgImage === "string" ? parsed.heroBgImage : "";
      if (urlMatches(hero, target)) {
        references.push({
          type: "LANDING",
          label: "الصفحة الرئيسية",
          field: "heroBgImage",
        });
      }
    } catch {
      /* invalid landing JSON — skip */
    }
  }

  return {
    mediaAssetId: asset.id,
    totalReferences: references.length,
    references,
  };
}
