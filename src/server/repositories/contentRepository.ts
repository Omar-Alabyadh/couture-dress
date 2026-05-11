import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";

export type PublicProductFilters = {
  q?: string;
  name?: string;
  size?: string;
  colorId?: string;
  category?: string;
};

export async function listCollectionItems() {
  return prisma.collectionItem.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { colors: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } },
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
    and.push({ sizes: { has: filters.size.trim() } });
  }
  if (filters.colorId) {
    and.push({
      colors: { some: { id: filters.colorId, deletedAt: null } },
    });
  }
  return prisma.collectionItem.findMany({
    where: { AND: and },
    orderBy: { createdAt: "desc" },
    include: { colors: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } } },
  });
}

export async function listCollectionForAdmin() {
  return prisma.collectionItem.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { colors: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function listTrashedCollection() {
  return prisma.collectionItem.findMany({
    where: { NOT: { deletedAt: null } },
    orderBy: { updatedAt: "desc" },
    include: { colors: true },
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
