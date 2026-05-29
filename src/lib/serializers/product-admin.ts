import type { Prisma } from "@/generated/prisma/client";

export type ProductVariantAdminJson = {
  id: string;
  size: string;
  colorId: string | null;
  quantity: number;
  isAvailable: boolean;
  allowSpecialOrder: boolean;
  sortOrder: number;
};

export type AdminProductJson = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  description: string | null;
  imageUrl: string;
  price: string | null;
  currency: string;
  discountPercent: number;
  discountActive: boolean;
  category: string;
  isPublished: boolean;
  deletedAt: string | null;
  sizes: string[];
  brandDesignerId: string | null;
  brandDesigner: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    type: string;
    deletedAt: string | null;
  } | null;
  colors: { id: string; label: string; deletedAt?: string | null }[];
  images: {
    id: string;
    url: string;
    alt: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }[];
  variants: ProductVariantAdminJson[];
  createdAt: string;
  updatedAt: string;
};

export type ProductWithColorsImagesVariants = Prisma.CollectionItemGetPayload<{
  include: { colors: true; images: true; variants: true; brandDesigner: true };
}>;

export function serializeProductForAdmin(
  row: ProductWithColorsImagesVariants,
): AdminProductJson {
  const variants = [...(row.variants ?? [])].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
  const bd = row.brandDesigner;
  return {
    id: row.id,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    description: row.description,
    imageUrl: row.imageUrl,
    price: row.price != null ? row.price.toString() : null,
    currency: row.currency || "LYD",
    discountPercent: row.discountPercent ?? 0,
    discountActive: row.discountActive ?? false,
    category: row.category,
    isPublished: row.isPublished,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    sizes: row.sizes ?? [],
    brandDesignerId: row.brandDesignerId ?? null,
    brandDesigner: bd
      ? {
          id: bd.id,
          nameAr: bd.nameAr,
          nameEn: bd.nameEn,
          type: bd.type,
          deletedAt: bd.deletedAt ? bd.deletedAt.toISOString() : null,
        }
      : null,
    colors: row.colors.map((c) => ({
      id: c.id,
      label: c.label,
      deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
    })),
    images: [...row.images]
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      )
      .map((i) => ({
        id: i.id,
        url: i.url,
        alt: i.alt,
        isPrimary: i.isPrimary,
        sortOrder: i.sortOrder,
      })),
    variants: variants.map((v) => ({
      id: v.id,
      size: v.size,
      colorId: v.colorId,
      colorLabel: v.colorLabel ?? null,
      quantity: v.quantity,
      isAvailable: v.isAvailable,
      allowSpecialOrder: v.allowSpecialOrder,
      sortOrder: v.sortOrder,
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
