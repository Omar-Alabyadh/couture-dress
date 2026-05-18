import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import {
  getProductCategories,
  saveProductCategories,
} from "@/lib/categories/product-categories";
import { isRecord } from "@/lib/validation/record";

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
    all[idx] = { ...cur, deletedAt: new Date().toISOString() };
    await saveProductCategories(all);
    return NextResponse.json({ data: all[idx] });
  }
  const nameAr =
    json.nameAr !== undefined ? String(json.nameAr).trim() : cur.nameAr;
  if (!nameAr) {
    return NextResponse.json({ error: "اسم القسم مطلوب." }, { status: 400 });
  }
  all[idx] = {
    ...cur,
    nameAr,
    nameEn:
      json.nameEn !== undefined
        ? String(json.nameEn).trim() || null
        : cur.nameEn,
    descriptionAr:
      json.descriptionAr !== undefined
        ? String(json.descriptionAr).trim() || null
        : cur.descriptionAr,
    sortOrder:
      json.sortOrder !== undefined ? Number(json.sortOrder) : cur.sortOrder,
  };
  await saveProductCategories(all);
  return NextResponse.json({ data: all[idx] });
}
