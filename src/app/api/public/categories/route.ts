import { NextResponse } from "next/server";
import { getProductCategories } from "@/lib/categories/product-categories";

export async function GET() {
  try {
    const data = await getProductCategories(false);
    return NextResponse.json({
      data: data.map((c) => ({
        slug: c.slug,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        descriptionAr: c.descriptionAr,
        sortOrder: c.sortOrder,
      })),
    });
  } catch {
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}
