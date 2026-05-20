import type { Prisma } from "@/generated/prisma/client";
import type { SizeOptionType } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import type { ProductCategoryRecord } from "@/lib/categories/product-categories";

type SortOrderDb = Pick<
  typeof prisma,
  "brandDesigner" | "testimonial" | "color" | "sizeOption"
>;

const brandWhereActive = { deletedAt: null } satisfies Prisma.BrandDesignerWhereInput;
const testimonialWhereActive = { deletedAt: null } satisfies Prisma.TestimonialWhereInput;
const colorWhereActive = { deletedAt: null } satisfies Prisma.ColorWhereInput;

function sizeWhereActive(type: SizeOptionType): Prisma.SizeOptionWhereInput {
  return { archivedAt: null, type };
}

export async function prepareBrandSortOrderInsert(
  sortOrder: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  await db.brandDesigner.updateMany({
    where: { ...brandWhereActive, sortOrder: { gte: sortOrder } },
    data: { sortOrder: { increment: 1 } },
  });
}

export async function prepareBrandSortOrderMove(
  id: string,
  from: number,
  to: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  if (from === to) return;
  if (to < from) {
    await db.brandDesigner.updateMany({
      where: {
        ...brandWhereActive,
        id: { not: id },
        sortOrder: { gte: to, lt: from },
      },
      data: { sortOrder: { increment: 1 } },
    });
  } else {
    await db.brandDesigner.updateMany({
      where: {
        ...brandWhereActive,
        id: { not: id },
        sortOrder: { gt: from, lte: to },
      },
      data: { sortOrder: { decrement: 1 } },
    });
  }
}

export async function prepareTestimonialSortOrderInsert(
  sortOrder: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  await db.testimonial.updateMany({
    where: { ...testimonialWhereActive, sortOrder: { gte: sortOrder } },
    data: { sortOrder: { increment: 1 } },
  });
}

export async function prepareTestimonialSortOrderMove(
  id: string,
  from: number,
  to: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  if (from === to) return;
  if (to < from) {
    await db.testimonial.updateMany({
      where: {
        ...testimonialWhereActive,
        id: { not: id },
        sortOrder: { gte: to, lt: from },
      },
      data: { sortOrder: { increment: 1 } },
    });
  } else {
    await db.testimonial.updateMany({
      where: {
        ...testimonialWhereActive,
        id: { not: id },
        sortOrder: { gt: from, lte: to },
      },
      data: { sortOrder: { decrement: 1 } },
    });
  }
}

export async function prepareColorSortOrderInsert(
  sortOrder: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  await db.color.updateMany({
    where: { ...colorWhereActive, sortOrder: { gte: sortOrder } },
    data: { sortOrder: { increment: 1 } },
  });
}

export async function prepareColorSortOrderMove(
  id: string,
  from: number,
  to: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  if (from === to) return;
  if (to < from) {
    await db.color.updateMany({
      where: {
        ...colorWhereActive,
        id: { not: id },
        sortOrder: { gte: to, lt: from },
      },
      data: { sortOrder: { increment: 1 } },
    });
  } else {
    await db.color.updateMany({
      where: {
        ...colorWhereActive,
        id: { not: id },
        sortOrder: { gt: from, lte: to },
      },
      data: { sortOrder: { decrement: 1 } },
    });
  }
}

export async function prepareSizeSortOrderInsert(
  type: SizeOptionType,
  sortOrder: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  await db.sizeOption.updateMany({
    where: { ...sizeWhereActive(type), sortOrder: { gte: sortOrder } },
    data: { sortOrder: { increment: 1 } },
  });
}

export async function prepareSizeSortOrderMove(
  id: string,
  type: SizeOptionType,
  from: number,
  to: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  if (from === to) return;
  const base = sizeWhereActive(type);
  if (to < from) {
    await db.sizeOption.updateMany({
      where: {
        ...base,
        id: { not: id },
        sortOrder: { gte: to, lt: from },
      },
      data: { sortOrder: { increment: 1 } },
    });
  } else {
    await db.sizeOption.updateMany({
      where: {
        ...base,
        id: { not: id },
        sortOrder: { gt: from, lte: to },
      },
      data: { sortOrder: { decrement: 1 } },
    });
  }
}

export function shiftCategorySortOrdersForInsert(
  all: ProductCategoryRecord[],
  insertAt: number,
): void {
  for (const c of all) {
    if (!c.deletedAt && c.sortOrder >= insertAt) {
      c.sortOrder += 1;
    }
  }
}

/** After archive/delete: close gap in active list (decrement sortOrder > removed). */
export async function compactBrandSortOrdersAfterRemoval(
  removedSortOrder: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  await db.brandDesigner.updateMany({
    where: { deletedAt: null, sortOrder: { gt: removedSortOrder } },
    data: { sortOrder: { decrement: 1 } },
  });
}

export async function compactTestimonialSortOrdersAfterRemoval(
  removedSortOrder: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  await db.testimonial.updateMany({
    where: { deletedAt: null, sortOrder: { gt: removedSortOrder } },
    data: { sortOrder: { decrement: 1 } },
  });
}

export async function compactColorSortOrdersAfterRemoval(
  removedSortOrder: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  await db.color.updateMany({
    where: { deletedAt: null, sortOrder: { gt: removedSortOrder } },
    data: { sortOrder: { decrement: 1 } },
  });
}

export async function compactSizeSortOrdersAfterRemoval(
  type: SizeOptionType,
  removedSortOrder: number,
  db: SortOrderDb = prisma,
): Promise<void> {
  await db.sizeOption.updateMany({
    where: { ...sizeWhereActive(type), sortOrder: { gt: removedSortOrder } },
    data: { sortOrder: { decrement: 1 } },
  });
}

export function compactCategorySortOrdersAfterRemoval(
  all: ProductCategoryRecord[],
  removedSortOrder: number,
): void {
  for (const c of all) {
    if (!c.deletedAt && c.sortOrder > removedSortOrder) {
      c.sortOrder -= 1;
    }
  }
}

export function shiftCategorySortOrdersForMove(
  all: ProductCategoryRecord[],
  id: string,
  from: number,
  to: number,
): void {
  if (from === to) return;
  for (const c of all) {
    if (c.id === id || c.deletedAt) continue;
    if (to < from && c.sortOrder >= to && c.sortOrder < from) {
      c.sortOrder += 1;
    } else if (to > from && c.sortOrder > from && c.sortOrder <= to) {
      c.sortOrder -= 1;
    }
  }
  const row = all.find((c) => c.id === id);
  if (row) row.sortOrder = to;
}
