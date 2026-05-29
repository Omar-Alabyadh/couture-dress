import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { isRecord } from "@/lib/validation/record";
import { parseDiscountPercent } from "@/lib/validation/product-input";
import { resolveProductDiscount } from "@/lib/products/discount";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Update the percentage discount for a single published product.
 * Body: { discountPercent: number (0-100), discountActive: boolean }
 */
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

  const percent = parseDiscountPercent(json.discountPercent);
  if (percent === "invalid") {
    return NextResponse.json(
      { error: "نسبة الخصم يجب أن تكون رقمًا صحيحًا بين 0 و 100." },
      { status: 400 },
    );
  }
  const active = Boolean(json.discountActive) && percent > 0;

  try {
    const existing = await prisma.collectionItem.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, isPublished: true, price: true, currency: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }
    if (!existing.isPublished) {
      return NextResponse.json(
        { error: "لا يمكن تطبيق خصم على منتج غير منشور." },
        { status: 400 },
      );
    }
    if (active && (existing.price == null || existing.price.toString() === "")) {
      return NextResponse.json(
        { error: "أضف سعرًا للمنتج أولًا قبل تفعيل الخصم." },
        { status: 400 },
      );
    }

    const row = await prisma.collectionItem.update({
      where: { id, deletedAt: null },
      data: { discountPercent: percent, discountActive: active },
      select: {
        id: true,
        price: true,
        currency: true,
        discountPercent: true,
        discountActive: true,
      },
    });

    await logAudit({
      userId: r.session!.user.id,
      action: "UPDATE",
      entityType: "ProductDiscount",
      entityId: id,
      metadata: { discountPercent: percent, discountActive: active },
      ip,
    });

    const price = row.price != null ? row.price.toString() : null;
    const resolved = resolveProductDiscount({
      price,
      discountPercent: row.discountPercent,
      discountActive: row.discountActive,
    });
    return NextResponse.json({
      data: {
        id: row.id,
        price,
        currency: row.currency || "LYD",
        discountPercent: row.discountPercent,
        discountActive: row.discountActive,
        finalPrice: resolved.finalPrice,
        hasDiscount: resolved.hasDiscount,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر تحديث الخصم" }, { status: 400 });
  }
}
