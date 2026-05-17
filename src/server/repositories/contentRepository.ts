import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";

export type PublicProductFilters = {
  q?: string;
  name?: string;
  size?: string;
  colorId?: string;
  category?: string;
};

const imageInclude = {
  orderBy: [
    { sortOrder: "asc" as const },
    { createdAt: "asc" as const },
  ],
};

const variantInclude = {
  orderBy: [
    { sortOrder: "asc" as const },
    { id: "asc" as const },
  ],
};

const brandDesignerSelect = {
  id: true,
  nameAr: true,
  nameEn: true,
  type: true,
  isPublished: true,
  deletedAt: true,
} as const;

export async function listCollectionItems() {
  return prisma.collectionItem.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      colors: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      images: imageInclude,
      variants: variantInclude,
      brandDesigner: { select: brandDesignerSelect },
    },
  });
}

export async function listPublicProducts(filters: PublicProductFilters) {
  const and: Prisma.CollectionItemWhereInput[] = [
    { isPublished: true, deletedAt: null },
  ];
  if (filters.category && filters.category !== "all") {
    and.push({ category: filters.category });
  }
  if (filters.name) {
    and.push({
      titleAr: { contains: filters.name.trim(), mode: "insensitive" },
    });
  }
  if (filters.q) {
    const t = filters.q.trim();
    and.push({
      OR: [
        { titleAr: { contains: t, mode: "insensitive" } },
        { description: { contains: t, mode: "insensitive" } },
      ],
    });
  }
  if (filters.size) {
    const sz = filters.size.trim();
    and.push({
      OR: [
        { variants: { none: {} }, sizes: { has: sz } },
        {
          variants: {
            some: {
              size: sz,
              isAvailable: true,
              quantity: { gt: 0 },
            },
          },
        },
      ],
    });
  }
  if (filters.colorId) {
    and.push({
      OR: [
        {
          variants: { none: {} },
          colors: { some: { id: filters.colorId, deletedAt: null } },
        },
        {
          variants: {
            some: {
              colorId: filters.colorId,
              isAvailable: true,
              quantity: { gt: 0 },
            },
          },
        },
      ],
    });
  }
  return prisma.collectionItem.findMany({
    where: { AND: and },
    orderBy: { createdAt: "desc" },
    include: {
      colors: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      images: imageInclude,
      variants: variantInclude,
      brandDesigner: { select: brandDesignerSelect },
    },
  });
}

export async function listCollectionForAdmin() {
  return prisma.collectionItem.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      colors: { orderBy: { sortOrder: "asc" } },
      images: imageInclude,
      variants: variantInclude,
      brandDesigner: { select: brandDesignerSelect },
    },
  });
}

export async function listTrashedCollection() {
  return prisma.collectionItem.findMany({
    where: { NOT: { deletedAt: null } },
    orderBy: { updatedAt: "desc" },
    include: { colors: true, images: imageInclude, variants: variantInclude },
  });
}

export async function listActiveColors() {
  return prisma.color.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listColorsForAdmin() {
  return prisma.color.findMany({ orderBy: { sortOrder: "asc" } });
}
