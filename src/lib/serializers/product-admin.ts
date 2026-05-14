import type { Prisma } from "@/generated/prisma/client";
export type AdminProductJson = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  description: string | null;
  imageUrl: string;
  price: string | null;
  currency: string;
  category: string;
  isPublished: boolean;
  sizes: string[];
  colors: { id: string; label: string; deletedAt?: string | null }[];
  images: {
    id: string;
    url: string;
    alt: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }[];
};

export type ProductWithColorsAndImages = Prisma.CollectionItemGetPayload<{
  include: { colors: true; images: true };
}>;

export function serializeProductForAdmin(
  row: ProductWithColorsAndImages,
): AdminProductJson {
  return {
    id: row.id,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    description: row.description,
    imageUrl: row.imageUrl,
    price: row.price != null ? row.price.toString() : null,
    currency: row.currency || "LYD",
    category: row.category,
    isPublished: row.isPublished,
    sizes: row.sizes ?? [],
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
  };
}
