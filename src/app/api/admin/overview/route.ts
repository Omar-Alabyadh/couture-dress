import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { deriveProductAdminStatus } from "@/lib/admin/product-status";

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    const [
      products,
      mediaCount,
      testimonialsCount,
      brandsCount,
      latestAudit,
    ] = await Promise.all([
      prisma.collectionItem.findMany({
        where: { deletedAt: null },
        select: {
          isPublished: true,
          variants: {
            select: { quantity: true, isAvailable: true },
          },
          sizes: true,
        },
      }),
      prisma.mediaAsset.count({ where: { isArchived: false } }),
      prisma.testimonial.count({ where: { deletedAt: null } }),
      prisma.brandDesigner.count({ where: { deletedAt: null } }),
      prisma.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          action: true,
          entityType: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    let published = 0;
    let unavailable = 0;
    let draft = 0;
    for (const p of products) {
      const status = deriveProductAdminStatus({
        isPublished: p.isPublished,
        variants: p.variants,
        sizes: p.sizes,
      });
      if (status === "PUBLISHED") published += 1;
      else if (status === "OUT_OF_STOCK") unavailable += 1;
      else if (status === "DRAFT") draft += 1;
    }

    return NextResponse.json({
      data: {
        totalProducts: products.length,
        publishedProducts: published,
        unavailableProducts: unavailable,
        draftProducts: draft,
        mediaCount,
        testimonialsCount,
        brandsCount,
        latestActivity: latestAudit
          ? {
              at: latestAudit.createdAt.toISOString(),
              action: latestAudit.action,
              entityType: latestAudit.entityType,
              userLabel:
                latestAudit.user.name ??
                latestAudit.user.email ??
                "مستخدم",
            }
          : null,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}
