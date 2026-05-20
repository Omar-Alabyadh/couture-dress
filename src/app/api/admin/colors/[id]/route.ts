import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { isRecord } from "@/lib/validation/record";
import {
  clampSortOrder,
  normalizeColorLabel,
  normalizeOptionalColorHex,
} from "@/lib/validation/color-input";
import {
  compactColorSortOrdersAfterRemoval,
  prepareColorSortOrderMove,
} from "@/server/services/sortOrderShiftService";

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
  if (json.restore === true) {
    try {
      const row = await prisma.color.update({
        where: { id },
        data: { deletedAt: null },
      });
      await logAudit({
        userId: r.session!.user.id,
        action: "RESTORE",
        entityType: "Color",
        entityId: id,
        metadata: { label: row.label },
        ip,
      });
      return NextResponse.json({ data: row });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "تعذر الاسترجاع" }, { status: 400 });
    }
  }

  if (json.softDelete === true) {
    try {
      const existing = await prisma.color.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "غير موجود" }, { status: 404 });
      }
      const row = await prisma.$transaction(async (tx) => {
        const updated = await tx.color.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        await compactColorSortOrdersAfterRemoval(existing.sortOrder, tx);
        return updated;
      });
      await logAudit({
        userId: r.session!.user.id,
        action: "SOFT_DELETE",
        entityType: "Color",
        entityId: id,
        metadata: { label: row.label },
        ip,
      });
      return NextResponse.json({ data: row });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "تعذر الحذف" }, { status: 400 });
    }
  }
  const data: { label?: string; hex?: string | null; sortOrder?: number } = {};
  if (json.label !== undefined) {
    const label = normalizeColorLabel(String(json.label));
    if (label) data.label = label;
  }
  if (json.hex !== undefined) {
    if (json.hex === null || json.hex === "") {
      data.hex = null;
    } else {
      const parsed = normalizeOptionalColorHex(json.hex);
      if (!parsed.ok) {
        return NextResponse.json({ error: "قيمة hex غير صالحة" }, { status: 400 });
      }
      data.hex = parsed.value;
    }
  }
  if (json.sortOrder !== undefined && Number.isFinite(Number(json.sortOrder))) {
    data.sortOrder = clampSortOrder(Number(json.sortOrder));
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا حقول للتحديث" }, { status: 400 });
  }
  try {
    const existing = await prisma.color.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    const row =
      data.sortOrder !== undefined && data.sortOrder !== existing.sortOrder
        ? await prisma.$transaction(async (tx) => {
            await prepareColorSortOrderMove(
              id,
              existing.sortOrder,
              data.sortOrder!,
              tx,
            );
            return tx.color.update({ where: { id }, data });
          })
        : await prisma.color.update({ where: { id }, data });
    await logAudit({
      userId: r.session!.user.id,
      action: "UPDATE",
      entityType: "Color",
      entityId: id,
      ip,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر التحديث" }, { status: 400 });
  }
}
