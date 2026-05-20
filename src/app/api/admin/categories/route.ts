import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import {
  getProductCategories,
  saveProductCategories,
  type ProductCategoryRecord,
} from "@/lib/categories/product-categories";
import { isRecord } from "@/lib/validation/record";
import { clampSortOrder } from "@/lib/validation/color-input";
import { nextSortOrder } from "@/lib/admin/sort-order";
import { shiftCategorySortOrdersForInsert } from "@/server/services/sortOrderShiftService";

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
    .slice(0, 48);
}

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    const data = await getProductCategories(true);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const r = await requireOwner();
  if (r.error) return r.error;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!isRecord(json)) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const nameAr = String(json.nameAr ?? "").trim();
  if (!nameAr) {
    return NextResponse.json({ error: "اسم القسم مطلوب." }, { status: 400 });
  }
  const slugRaw = String(json.slug ?? "").trim();
  const slug = slugify(slugRaw || nameAr);
  if (!slug) {
    return NextResponse.json({ error: "المعرّف غير صالح." }, { status: 400 });
  }
  const all = await getProductCategories(true);
  if (all.some((c) => c.slug === slug && !c.deletedAt)) {
    return NextResponse.json({ error: "هذا القسم موجود مسبقًا." }, { status: 400 });
  }
  const active = all.filter((c) => !c.deletedAt);
  const sortOrder = clampSortOrder(
    Number.isFinite(Number(json.sortOrder))
      ? Number(json.sortOrder)
      : nextSortOrder(active),
  );
  shiftCategorySortOrdersForInsert(all, sortOrder);
  const row: ProductCategoryRecord = {
    id: `cat-${slug}-${Date.now()}`,
    slug,
    nameAr,
    nameEn: String(json.nameEn ?? "").trim() || null,
    descriptionAr: String(json.descriptionAr ?? "").trim() || null,
    sortOrder,
    deletedAt: null,
  };
  await saveProductCategories([...all, row]);
  return NextResponse.json({ data: row });
}
