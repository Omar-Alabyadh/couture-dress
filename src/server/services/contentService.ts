import type {
  CollectionItem as PrismaCollectionItem,
  Color,
  ProductImage,
  ProductVariant,
} from "@/generated/prisma/client";
import type {
  CollectionCategory,
  CollectionItemView,
  ProductColorView,
  ProductImageView,
  ProductVariantView,
} from "@/lib/types/collection";
import { isVariantSellable } from "@/lib/types/collection";
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

type RowWithRelations = PrismaCollectionItem & {
  colors: Color[];
  images: ProductImage[];
  variants: ProductVariant[];
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

function mapVariantToView(
  v: ProductVariant,
  colorById: Map<string, Color>,
): ProductVariantView {
  return {
    id: v.id,
    size: v.size,
    colorId: v.colorId,
    colorLabel: v.colorId ? colorById.get(v.colorId)?.label ?? null : null,
    quantity: v.quantity,
    isAvailable: v.isAvailable,
    allowSpecialOrder: v.allowSpecialOrder,
    sortOrder: v.sortOrder,
  };
}

/** Unique size strings in variant sort order where predicate holds */
function uniqueVariantSizes(
  views: ProductVariantView[],
  predicate: (v: ProductVariantView) => boolean,
): string[] {
  const sorted = [...views].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of sorted) {
    if (!predicate(v)) continue;
    const s = v.size.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function mapCollectionItem(
  row: RowWithRelations,
  colorsOverride?: Color[],
): CollectionItemView {
  const category = allowedCategories.has(row.category as CollectionCategory)
    ? (row.category as CollectionCategory)
    : "dresses";

  const colorRows = colorsOverride ?? row.colors;
  const colorById = new Map(colorRows.map((c) => [c.id, c]));

  const imageRows = [...(row.images ?? [])].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const images = imageRows.map(mapProductImage);
  const primary =
    images.find((i) => i.isPrimary) ?? images[0] ?? null;
  const titleForAlt = row.titleEn?.trim() ? row.titleEn : row.titleAr;

  const variantRows = [...(row.variants ?? [])].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
  const variants = variantRows.map((v) => mapVariantToView(v, colorById));

  let availableSizes: string[];
  let unavailableSizes: string[];

  if (variants.length === 0) {
    const legacy = (row.sizes ?? [])
      .map((s) => s.trim())
      .filter(Boolean);
    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const s of legacy) {
      if (seen.has(s)) continue;
      seen.add(s);
      uniq.push(s);
    }
    availableSizes = uniq;
    unavailableSizes = [];
  } else {
    availableSizes = uniqueVariantSizes(variants, isVariantSellable);
    unavailableSizes = uniqueVariantSizes(
      variants,
      (v) => !isVariantSellable(v),
    );
  }

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
    variants,
    availableSizes,
    unavailableSizes,
  };
}

export async function getPublicCollectionItemsForHome(): Promise<
  CollectionItemView[]
> {
  const rows = await listCollectionItems();
  return rows.map((r) => mapCollectionItem(r as RowWithRelations));
}

export async function getPublicProducts(
  filters: PublicProductFilters,
): Promise<CollectionItemView[]> {
  const rows = await listPublicProducts(filters);
  return rows.map((r) => mapCollectionItem(r as RowWithRelations));
}

export async function getFilterSizes(): Promise<string[]> {
  const rows = await prisma.collectionItem.findMany({
    where: { isPublished: true, deletedAt: null },
    select: {
      sizes: true,
      variants: { select: { size: true } },
    },
  });
  const set = new Set<string>();
  for (const r of rows) {
    for (const v of r.variants) {
      const t = v.size.trim();
      if (t) set.add(t);
    }
    for (const z of r.sizes) {
      const t = z.trim();
      if (t) set.add(t);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
}
