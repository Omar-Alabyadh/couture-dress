import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import {
  getProductCategories,
  saveProductCategories,
} from "@/lib/categories/product-categories";
import { isRecord } from "@/lib/validation/record";
import { compactCategorySortOrdersAfterRemoval } from "@/server/services/sortOrderShiftService";
import { clampSortOrder } from "@/lib/validation/color-input";
import { shiftCategorySortOrdersForMove } from "@/server/services/sortOrderShiftService";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const { id } = await params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!isRecord(json)) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const all = await getProductCategories(true);
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
  }
  const cur = all[idx]!;
  if (json.restore === true) {
    all[idx] = { ...cur, deletedAt: null };
    await saveProductCategories(all);
    return NextResponse.json({ data: all[idx] });
  }
  if (json.softDelete === true) {
    compactCategorySortOrdersAfterRemoval(all, cur.sortOrder);
    all[idx] = { ...cur, deletedAt: new Date().toISOString() };
    await saveProductCategories(all);
    return NextResponse.json({ data: all[idx] });
  }
  const nameAr =
    json.nameAr !== undefined ? String(json.nameAr).trim() : cur.nameAr;
  if (!nameAr) {
    return NextResponse.json({ error: "اسم القسم مطلوب." }, { status: 400 });
  }
  const newSort =
    json.sortOrder !== undefined
      ? clampSortOrder(Number(json.sortOrder))
      : cur.sortOrder;
  if (json.sortOrder !== undefined && newSort !== cur.sortOrder) {
    shiftCategorySortOrdersForMove(all, id, cur.sortOrder, newSort);
  }
  const updated = all[idx]!;
  all[idx] = {
    ...updated,
    nameAr,
    nameEn:
      json.nameEn !== undefined
        ? String(json.nameEn).trim() || null
        : updated.nameEn,
    descriptionAr:
      json.descriptionAr !== undefined
        ? String(json.descriptionAr).trim() || null
        : updated.descriptionAr,
    sortOrder: newSort,
  };
  await saveProductCategories(all);
  return NextResponse.json({ data: all[idx] });
}
