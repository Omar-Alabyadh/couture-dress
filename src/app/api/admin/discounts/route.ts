import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { resolveProductDiscount } from "@/lib/products/discount";

export type AdminDiscountRow = {
  id: string;
  titleAr: string;
  category: string;
  imageUrl: string;
  price: string | null;
  currency: string;
  discountPercent: number;
  discountActive: boolean;
  finalPrice: string | null;
  hasDiscount: boolean;
};

/** List published, non-deleted products with discount-relevant fields. */
export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    const rows = await prisma.collectionItem.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titleAr: true,
        category: true,
        imageUrl: true,
        price: true,
        currency: true,
        discountPercent: true,
        discountActive: true,
        images: {
          where: { isPrimary: true },
          select: { url: true },
          take: 1,
        },
      },
    });
    const data: AdminDiscountRow[] = rows.map((row) => {
      const price = row.price != null ? row.price.toString() : null;
      const resolved = resolveProductDiscount({
        price,
        discountPercent: row.discountPercent,
        discountActive: row.discountActive,
      });
      return {
        id: row.id,
        titleAr: row.titleAr,
        category: row.category,
        imageUrl: row.images[0]?.url ?? row.imageUrl,
        price,
        currency: row.currency || "LYD",
        discountPercent: row.discountPercent ?? 0,
        discountActive: row.discountActive ?? false,
        finalPrice: resolved.finalPrice,
        hasDiscount: resolved.hasDiscount,
      };
    });
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر تحميل المنتجات" }, { status: 500 });
  }
}
