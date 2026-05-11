import type {
  CollectionItem as PrismaCollectionItem,
  Color,
} from "@/generated/prisma/client";
import type {
  CollectionCategory,
  CollectionItemView,
  ProductColorView,
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
};

function mapCollectionItem(
  row: RowWithColors,
  colorsOverride?: Color[],
): CollectionItemView {
  const category = allowedCategories.has(row.category as CollectionCategory)
    ? (row.category as CollectionCategory)
    : "dresses";

  const colorRows = colorsOverride ?? row.colors;

  return {
    id: row.id,
    title: row.titleAr,
    description: row.description,
    imageUrl: row.imageUrl,
    imageAlt: row.titleEn?.trim() ? row.titleEn : row.titleAr,
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
