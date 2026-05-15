import { prisma } from "@/server/db/client";

export async function listTestimonialsForAdmin() {
  return prisma.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function listPublishedTestimonials() {
  return prisma.testimonial.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function listBrandDesignersForAdmin() {
  return prisma.brandDesigner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

/** Published, active rows for public strip / product picker. */
export async function listPublishedBrandDesignersForPicker() {
  return prisma.brandDesigner.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      type: true,
      logoUrl: true,
    },
  });
}

export async function listPublishedBrandDesignersForHomeStrip(take = 14) {
  return prisma.brandDesigner.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      type: true,
      logoUrl: true,
    },
  });
}
