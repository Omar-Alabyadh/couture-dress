import type {
  CollectionItem as PrismaCollectionItem,
  Color,
  ProductImage,
} from "@/generated/prisma/client";
import type {
  CollectionCategory,
  CollectionItemView,
  ProductColorView,
  ProductImageView,
} from "@/lib/types/collection";
import {
  listCollectionItems,
  listPublicProducts,
  type PublicProductFilters,
} from "@/server/repositories/contentRepository";
import { prisma } from "@/server/db/client";

const allowedCategories = new Set<CollectionCategory>([
  "dresses",
  "abayas",
  "casual",
  "accessories",
]);

function mapColor(c: Color): ProductColorView {
  return { id: c.id, label: c.label, hex: c.hex };
}

type RowWithColors = PrismaCollectionItem & {
  colors: Color[];
  images: ProductImage[];
};

function mapProductImage(row: ProductImage): ProductImageView {
  return {
    id: row.id,
    url: row.url,
    alt: row.alt,
    isPrimary: row.isPrimary,
    sortOrder: row.sortOrder,
  };
}

function mapCollectionItem(
  row: RowWithColors,
  colorsOverride?: Color[],
): CollectionItemView {
  const category = allowedCategories.has(row.category as CollectionCategory)
    ? (row.category as CollectionCategory)
    : "dresses";

  const colorRows = colorsOverride ?? row.colors;
  const imageRows = [...(row.images ?? [])].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const images = imageRows.map(mapProductImage);
  const primary =
    images.find((i) => i.isPrimary) ?? images[0] ?? null;
  const titleForAlt = row.titleEn?.trim() ? row.titleEn : row.titleAr;

  return {
    id: row.id,
    title: row.titleAr,
    description: row.description,
    imageUrl: row.imageUrl,
    imageAlt: titleForAlt,
    images,
    primaryImage: primary,
    price: row.price != null ? row.price.toString() : null,
    currency: row.currency || "LYD",
    category,
    sizes: row.sizes ?? [],
    colors: (colorRows ?? []).map(mapColor),
  };
}

export async function getPublicCollectionItemsForHome(): Promise<
  CollectionItemView[]
> {
  const rows = await listCollectionItems();
  return rows.map((r) => mapCollectionItem(r as RowWithColors));
}

export async function getPublicProducts(
  filters: PublicProductFilters,
): Promise<CollectionItemView[]> {
  const rows = await listPublicProducts(filters);
  return rows.map((r) => mapCollectionItem(r as RowWithColors));
}

export async function getFilterSizes(): Promise<string[]> {
  const rows = await prisma.collectionItem.findMany({
    where: { isPublished: true, deletedAt: null },
    select: { sizes: true },
  });
  const s = new Set<string>();
  for (const r of rows) for (const z of r.sizes) s.add(z);
  return Array.from(s).sort((a, b) => a.localeCompare(b, "ar"));
}
