import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { isRecord } from "@/lib/validation/record";
import {
  clampRating,
  normalizeOptionalTestimonialImageUrl,
  normalizeTestimonialCustomerName,
  normalizeTestimonialText,
  parseTestimonialSortOrder,
} from "@/lib/validation/testimonial-input";

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
      const row = await prisma.testimonial.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await logAudit({
        userId: r.session!.user.id,
        action: "SOFT_DELETE",
        entityType: "Testimonial",
        entityId: id,
        metadata: { customerName: row.customerName },
        ip,
      });
      return NextResponse.json({ data: row });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "تعذر الأرشفة" }, { status: 400 });
    }
  }

  const data: {
    customerName?: string;
    text?: string;
    rating?: number;
    imageUrl?: string | null;
    sortOrder?: number;
    isPublished?: boolean;
  } = {};

  if (json.customerName !== undefined) {
    const n = normalizeTestimonialCustomerName(String(json.customerName));
    if (!n) {
      return NextResponse.json({ error: "اسم غير صالح" }, { status: 400 });
    }
    data.customerName = n;
  }
  if (json.text !== undefined) {
    const t = normalizeTestimonialText(String(json.text));
    if (!t) {
      return NextResponse.json({ error: "نص غير صالح" }, { status: 400 });
    }
    data.text = t;
  }
  if (json.rating !== undefined) {
    data.rating = clampRating(Number(json.rating));
  }
  if (json.imageUrl !== undefined) {
    if (json.imageUrl === null || json.imageUrl === "") {
      data.imageUrl = null;
    } else {
      const img = normalizeOptionalTestimonialImageUrl(json.imageUrl);
      if (!img.ok) {
        return NextResponse.json({ error: "رابط صورة غير صالح" }, { status: 400 });
      }
      data.imageUrl = img.value;
    }
  }
  if (json.sortOrder !== undefined) {
    data.sortOrder = parseTestimonialSortOrder(json.sortOrder);
  }
  if (json.isPublished !== undefined) {
    data.isPublished = Boolean(json.isPublished);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا حقول للتحديث" }, { status: 400 });
  }

  try {
    const row = await prisma.testimonial.update({
      where: { id },
      data,
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "UPDATE",
      entityType: "Testimonial",
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
