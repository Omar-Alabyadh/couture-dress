import { prisma } from "@/server/db/client";

export const PRODUCT_CATEGORIES_SETTING_KEY = "product_categories_v1";

export type ProductCategoryRecord = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  sortOrder: number;
  deletedAt: string | null;
};

export const LEGACY_CATEGORY_SLUGS = [
  "dresses",
  "abayas",
  "casual",
  "accessories",
  "suits",
] as const;

export const DEFAULT_PRODUCT_CATEGORIES: ProductCategoryRecord[] = [
  {
    id: "cat-dresses",
    slug: "dresses",
    nameAr: "فساتين",
    nameEn: "Dresses",
    descriptionAr: "فساتين سهرة وزفاف بقصّات راقية ولمسات كوتور.",
    sortOrder: 0,
    deletedAt: null,
  },
  {
    id: "cat-abayas",
    slug: "abayas",
    nameAr: "عبايات وجلابيات",
    nameEn: "Abayas",
    descriptionAr: "عبايات وجلابيات بخامات ناعمة وتفاصيل هادئة.",
    sortOrder: 1,
    deletedAt: null,
  },
  {
    id: "cat-suits",
    slug: "suits",
    nameAr: "بدل وأطقم",
    nameEn: "Suits",
    descriptionAr: "بدل وأطقم أنيقة للمناسبات والعمل.",
    sortOrder: 2,
    deletedAt: null,
  },
  {
    id: "cat-casual",
    slug: "casual",
    nameAr: "كاجوال",
    nameEn: "Casual",
    descriptionAr: "قطع يومية عصرية مريحة بلمسة راقية.",
    sortOrder: 3,
    deletedAt: null,
  },
  {
    id: "cat-accessories",
    slug: "accessories",
    nameAr: "إكسسوارات",
    nameEn: "Accessories",
    descriptionAr: "إكسسوارات تكمّل إطلالتك بعناية.",
    sortOrder: 4,
    deletedAt: null,
  },
];

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function parseCategory(x: unknown): ProductCategoryRecord | null {
  if (!isRecord(x) || typeof x.slug !== "string" || typeof x.nameAr !== "string") {
    return null;
  }
  return {
    id: typeof x.id === "string" ? x.id : `cat-${x.slug}`,
    slug: x.slug.trim(),
    nameAr: x.nameAr.trim(),
    nameEn: typeof x.nameEn === "string" ? x.nameEn.trim() || null : null,
    descriptionAr:
      typeof x.descriptionAr === "string" ? x.descriptionAr.trim() || null : null,
    sortOrder: typeof x.sortOrder === "number" ? x.sortOrder : 0,
    deletedAt: typeof x.deletedAt === "string" ? x.deletedAt : null,
  };
}

export function parseProductCategoriesJson(
  raw: string | null | undefined,
): ProductCategoryRecord[] {
  if (!raw) return [...DEFAULT_PRODUCT_CATEGORIES];
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [...DEFAULT_PRODUCT_CATEGORIES];
    const parsed = j.map(parseCategory).filter((c): c is ProductCategoryRecord => !!c);
    return parsed.length > 0 ? parsed : [...DEFAULT_PRODUCT_CATEGORIES];
  } catch {
    return [...DEFAULT_PRODUCT_CATEGORIES];
  }
}

export async function getProductCategories(
  includeArchived = false,
): Promise<ProductCategoryRecord[]> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: PRODUCT_CATEGORIES_SETTING_KEY },
  });
  const all = parseProductCategoriesJson(row?.value);
  const sorted = [...all].sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));
  if (includeArchived) return sorted;
  return sorted.filter((c) => !c.deletedAt);
}

export async function saveProductCategories(
  categories: ProductCategoryRecord[],
): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: PRODUCT_CATEGORIES_SETTING_KEY },
    create: {
      key: PRODUCT_CATEGORIES_SETTING_KEY,
      value: JSON.stringify(categories),
    },
    update: { value: JSON.stringify(categories) },
  });
}

export function categoryLabelBySlug(
  categories: ProductCategoryRecord[],
  slug: string,
): string {
  const hit = categories.find((c) => c.slug === slug && !c.deletedAt);
  if (hit) return hit.nameAr;
  const legacy: Record<string, string> = {
    dresses: "فساتين",
    abayas: "عبايات",
    casual: "كاجوال",
    accessories: "إكسسوارات",
    suits: "بدل وأطقم",
  };
  return legacy[slug] ?? slug;
}

export async function getAllowedCategorySlugs(): Promise<Set<string>> {
  const rows = await getProductCategories(true);
  const slugs = new Set<string>(LEGACY_CATEGORY_SLUGS);
  for (const c of rows) {
    if (!c.deletedAt) slugs.add(c.slug);
  }
  return slugs;
}
