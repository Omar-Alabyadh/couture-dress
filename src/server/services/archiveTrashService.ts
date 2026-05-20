import { prisma } from "@/server/db/client";
import { updateMediaAsset } from "@/server/repositories/mediaRepository";
import { getProductCategories } from "@/lib/categories/product-categories";

export type TrashEntityType =
  | "product"
  | "brand"
  | "testimonial"
  | "color"
  | "size"
  | "media"
  | "category";

export type TrashArchiveRow = {
  entityType: TrashEntityType;
  id: string;
  label: string;
  archivedAt: string;
  moduleHref: string;
  moduleLabel: string;
  field: string;
};

function toIso(d: Date): string {
  return d.toISOString();
}

export async function listArchivedItems(): Promise<TrashArchiveRow[]> {
  const [products, brands, testimonials, colors, sizes, media] = await Promise.all([
    prisma.collectionItem.findMany({
      where: { NOT: { deletedAt: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, titleAr: true, deletedAt: true },
    }),
    prisma.brandDesigner.findMany({
      where: { NOT: { deletedAt: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, nameAr: true, deletedAt: true },
    }),
    prisma.testimonial.findMany({
      where: { NOT: { deletedAt: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, customerName: true, deletedAt: true },
    }),
    prisma.color.findMany({
      where: { NOT: { deletedAt: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, label: true, deletedAt: true },
    }),
    prisma.sizeOption.findMany({
      where: { NOT: { archivedAt: null } },
      orderBy: { archivedAt: "desc" },
      select: { id: true, label: true, archivedAt: true },
    }),
    prisma.mediaAsset.findMany({
      where: { isArchived: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        originalFilename: true,
        updatedAt: true,
      },
    }),
  ]);

  const rows: TrashArchiveRow[] = [];

  for (const p of products) {
    if (!p.deletedAt) continue;
    rows.push({
      entityType: "product",
      id: p.id,
      label: p.titleAr,
      archivedAt: toIso(p.deletedAt),
      moduleHref: "/admin/manage/products",
      moduleLabel: "المنتجات",
      field: "CollectionItem.deletedAt",
    });
  }
  for (const b of brands) {
    if (!b.deletedAt) continue;
    rows.push({
      entityType: "brand",
      id: b.id,
      label: b.nameAr,
      archivedAt: toIso(b.deletedAt),
      moduleHref: "/admin/manage/brands",
      moduleLabel: "ماركات ومصممين",
      field: "BrandDesigner.deletedAt",
    });
  }
  for (const t of testimonials) {
    if (!t.deletedAt) continue;
    rows.push({
      entityType: "testimonial",
      id: t.id,
      label: t.customerName,
      archivedAt: toIso(t.deletedAt),
      moduleHref: "/admin/manage/testimonials",
      moduleLabel: "آراء العملاء",
      field: "Testimonial.deletedAt",
    });
  }
  for (const c of colors) {
    if (!c.deletedAt) continue;
    rows.push({
      entityType: "color",
      id: c.id,
      label: c.label,
      archivedAt: toIso(c.deletedAt),
      moduleHref: "/admin/manage/colors",
      moduleLabel: "الألوان",
      field: "Color.deletedAt",
    });
  }
  for (const s of sizes) {
    if (!s.archivedAt) continue;
    rows.push({
      entityType: "size",
      id: s.id,
      label: s.label,
      archivedAt: toIso(s.archivedAt),
      moduleHref: "/admin/manage/sizes",
      moduleLabel: "المقاسات",
      field: "SizeOption.archivedAt",
    });
  }
  for (const m of media) {
    rows.push({
      entityType: "media",
      id: m.id,
      label: m.originalFilename,
      archivedAt: toIso(m.updatedAt),
      moduleHref: "/admin/manage/media?archived=true",
      moduleLabel: "مكتبة الوسائط",
      field: "MediaAsset.isArchived",
    });
  }

  const categories = await getProductCategories(true);
  for (const c of categories) {
    if (!c.deletedAt) continue;
    rows.push({
      entityType: "category",
      id: c.id,
      label: c.nameAr,
      archivedAt: c.deletedAt,
      moduleHref: "/admin/manage/categories",
      moduleLabel: "الأقسام",
      field: "ProductCategory.deletedAt",
    });
  }

  rows.sort(
    (a, b) =>
      new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime(),
  );

  return rows;
}

export async function restoreArchivedItem(
  entityType: TrashEntityType,
  id: string,
): Promise<void> {
  switch (entityType) {
    case "product": {
      const r = await prisma.collectionItem.updateMany({
        where: { id, NOT: { deletedAt: null } },
        data: { deletedAt: null },
      });
      if (r.count === 0) throw new Error("NOT_FOUND");
      return;
    }
    case "brand": {
      const r = await prisma.brandDesigner.updateMany({
        where: { id, NOT: { deletedAt: null } },
        data: { deletedAt: null },
      });
      if (r.count === 0) throw new Error("NOT_FOUND");
      return;
    }
    case "testimonial": {
      const r = await prisma.testimonial.updateMany({
        where: { id, NOT: { deletedAt: null } },
        data: { deletedAt: null },
      });
      if (r.count === 0) throw new Error("NOT_FOUND");
      return;
    }
    case "color": {
      const r = await prisma.color.updateMany({
        where: { id, NOT: { deletedAt: null } },
        data: { deletedAt: null },
      });
      if (r.count === 0) throw new Error("NOT_FOUND");
      return;
    }
    case "size": {
      const r = await prisma.sizeOption.updateMany({
        where: { id, NOT: { archivedAt: null } },
        data: { archivedAt: null },
      });
      if (r.count === 0) throw new Error("NOT_FOUND");
      return;
    }
    case "media": {
      const row = await prisma.mediaAsset.findUnique({ where: { id } });
      if (!row?.isArchived) throw new Error("NOT_FOUND");
      await updateMediaAsset(id, { isArchived: false });
      return;
    }
    case "category": {
      const all = await getProductCategories(true);
      const idx = all.findIndex((c) => c.id === id && c.deletedAt);
      if (idx < 0) throw new Error("NOT_FOUND");
      all[idx] = { ...all[idx]!, deletedAt: null };
      const { saveProductCategories } = await import(
        "@/lib/categories/product-categories"
      );
      await saveProductCategories(all);
      return;
    }
    default:
      throw new Error("INVALID_TYPE");
  }
}

export async function permanentlyDeleteArchivedItem(
  entityType: TrashEntityType,
  id: string,
): Promise<void> {
  switch (entityType) {
    case "product": {
      const row = await prisma.collectionItem.findFirst({
        where: { id, NOT: { deletedAt: null } },
      });
      if (!row) throw new Error("NOT_FOUND");
      await prisma.collectionItem.delete({ where: { id } });
      return;
    }
    case "brand": {
      const row = await prisma.brandDesigner.findFirst({
        where: { id, NOT: { deletedAt: null } },
      });
      if (!row) throw new Error("NOT_FOUND");
      await prisma.brandDesigner.delete({ where: { id } });
      return;
    }
    case "testimonial": {
      const row = await prisma.testimonial.findFirst({
        where: { id, NOT: { deletedAt: null } },
      });
      if (!row) throw new Error("NOT_FOUND");
      await prisma.testimonial.delete({ where: { id } });
      return;
    }
    case "color": {
      const row = await prisma.color.findFirst({
        where: { id, NOT: { deletedAt: null } },
      });
      if (!row) throw new Error("NOT_FOUND");
      await prisma.productVariant.updateMany({
        where: { colorId: id },
        data: { colorId: null },
      });
      await prisma.color.update({
        where: { id },
        data: { items: { set: [] } },
      });
      await prisma.color.delete({ where: { id } });
      return;
    }
    case "size": {
      const row = await prisma.sizeOption.findFirst({
        where: { id, NOT: { archivedAt: null } },
      });
      if (!row) throw new Error("NOT_FOUND");
      await prisma.sizeOption.delete({ where: { id } });
      return;
    }
    case "media": {
      const row = await prisma.mediaAsset.findFirst({
        where: { id, isArchived: true },
      });
      if (!row) throw new Error("NOT_FOUND");
      await prisma.mediaAsset.delete({ where: { id } });
      return;
    }
    case "category": {
      const all = await getProductCategories(true);
      const idx = all.findIndex((c) => c.id === id && c.deletedAt);
      if (idx < 0) throw new Error("NOT_FOUND");
      const next = all.filter((c) => c.id !== id);
      const { saveProductCategories } = await import(
        "@/lib/categories/product-categories"
      );
      await saveProductCategories(next);
      return;
    }
    default:
      throw new Error("INVALID_TYPE");
  }
}
