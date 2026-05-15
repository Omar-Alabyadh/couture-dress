import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { listBrandDesignersForAdmin } from "@/server/repositories/cmsRepository";
import { isRecord } from "@/lib/validation/record";
import {
  normalizeBrandNameAr,
  normalizeOptionalBrandDescription,
  normalizeOptionalBrandLogoUrl,
  normalizeOptionalBrandNameEn,
  parseBrandDesignerType,
  parseBrandSortOrder,
} from "@/lib/validation/brand-designer-input";

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    const data = await listBrandDesignersForAdmin();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const ip = getClientIp(req);
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!isRecord(json)) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const nameAr = normalizeBrandNameAr(String(json.nameAr ?? ""));
  const type = parseBrandDesignerType(json.type);
  if (!nameAr || !type) {
    return NextResponse.json(
      { error: "الاسم العربي والنوع مطلوبان." },
      { status: 400 },
    );
  }
  const nameEn = normalizeOptionalBrandNameEn(json.nameEn);
  const descriptionAr = normalizeOptionalBrandDescription(json.descriptionAr);
  const descriptionEn = normalizeOptionalBrandDescription(json.descriptionEn);
  const logo = normalizeOptionalBrandLogoUrl(json.logoUrl);
  if (!logo.ok) {
    return NextResponse.json({ error: "رابط الشعار غير صالح" }, { status: 400 });
  }
  const sortOrder = parseBrandSortOrder(json.sortOrder);
  const isPublished = json.isPublished !== false;
  try {
    const row = await prisma.brandDesigner.create({
      data: {
        nameAr,
        nameEn,
        type,
        logoUrl: logo.value,
        descriptionAr,
        descriptionEn,
        isPublished,
        sortOrder,
        deletedAt: null,
      },
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "CREATE",
      entityType: "BrandDesigner",
      entityId: row.id,
      metadata: { nameAr, type },
      ip,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر الإنشاء" }, { status: 500 });
  }
}
