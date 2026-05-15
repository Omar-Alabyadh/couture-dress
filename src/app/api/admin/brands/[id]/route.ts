import { NextResponse } from "next/server";
import type { BrandDesignerType } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { isRecord } from "@/lib/validation/record";
import {
  normalizeBrandNameAr,
  normalizeOptionalBrandDescription,
  normalizeOptionalBrandLogoUrl,
  normalizeOptionalBrandNameEn,
  parseBrandDesignerType,
  parseBrandSortOrder,
} from "@/lib/validation/brand-designer-input";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const { id } = await ctx.params;
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

  if (json.softDelete === true) {
    try {
      const row = await prisma.brandDesigner.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await logAudit({
        userId: r.session!.user.id,
        action: "SOFT_DELETE",
        entityType: "BrandDesigner",
        entityId: id,
        metadata: { nameAr: row.nameAr },
        ip,
      });
      return NextResponse.json({ data: row });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "تعذر الأرشفة" }, { status: 400 });
    }
  }

  const data: {
    nameAr?: string;
    nameEn?: string | null;
    type?: BrandDesignerType;
    logoUrl?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
    sortOrder?: number;
    isPublished?: boolean;
  } = {};

  if (json.nameAr !== undefined) {
    const n = normalizeBrandNameAr(String(json.nameAr));
    if (!n) {
      return NextResponse.json({ error: "اسم عربي غير صالح" }, { status: 400 });
    }
    data.nameAr = n;
  }
  if (json.nameEn !== undefined) {
    data.nameEn = normalizeOptionalBrandNameEn(json.nameEn);
  }
  if (json.type !== undefined) {
    const t = parseBrandDesignerType(json.type);
    if (!t) {
      return NextResponse.json({ error: "نوع غير صالح" }, { status: 400 });
    }
    data.type = t;
  }
  if (json.logoUrl !== undefined) {
    if (json.logoUrl === null || json.logoUrl === "") {
      data.logoUrl = null;
    } else {
      const logo = normalizeOptionalBrandLogoUrl(json.logoUrl);
      if (!logo.ok) {
        return NextResponse.json({ error: "رابط الشعار غير صالح" }, { status: 400 });
      }
      data.logoUrl = logo.value;
    }
  }
  if (json.descriptionAr !== undefined) {
    data.descriptionAr = normalizeOptionalBrandDescription(json.descriptionAr);
  }
  if (json.descriptionEn !== undefined) {
    data.descriptionEn = normalizeOptionalBrandDescription(json.descriptionEn);
  }
  if (json.sortOrder !== undefined) {
    data.sortOrder = parseBrandSortOrder(json.sortOrder);
  }
  if (json.isPublished !== undefined) {
    data.isPublished = Boolean(json.isPublished);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا حقول للتحديث" }, { status: 400 });
  }

  try {
    const row = await prisma.brandDesigner.update({
      where: { id },
      data,
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "UPDATE",
      entityType: "BrandDesigner",
      entityId: id,
      metadata: { fields: Object.keys(data) },
      ip,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر التحديث" }, { status: 400 });
  }
}
