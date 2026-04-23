import type { CollectionItem as PrismaCollectionItem } from "@prisma/client";
import type { CollectionCategory, CollectionItemView } from "@/lib/types/collection";
import { listCollectionItems } from "@/server/repositories/contentRepository";

const allowedCategories = new Set<CollectionCategory>([
  "dresses",
  "abayas",
  "casual",
  "accessories",
]);

function mapCollectionItem(row: PrismaCollectionItem): CollectionItemView {
  const category = allowedCategories.has(row.category as CollectionCategory)
    ? (row.category as CollectionCategory)
    : "dresses";

  return {
    id: row.id,
    title: row.titleAr,
    description: row.description,
    imageUrl: row.imageUrl,
    imageAlt: row.titleEn?.trim() ? row.titleEn : row.titleAr,
    category,
  };
}

export async function getPublicCollectionItemsForHome(): Promise<
  CollectionItemView[]
> {
  const rows = await listCollectionItems();
  return rows.map(mapCollectionItem);
}
