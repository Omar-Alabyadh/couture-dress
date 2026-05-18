import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { isRecord } from "@/lib/validation/record";
import {
  clampSizeSortOrder,
  isValidSizeLabel,
  normalizeSizeLabel,
  parseSizeOptionType,
} from "@/lib/validation/size-input";

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
      const row = await prisma.sizeOption.update({
        where: { id },
        data: { archivedAt: null },
      });
      await logAudit({
        userId: r.session!.user.id,
        action: "RESTORE",
        entityType: "SizeOption",
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
      const row = await prisma.sizeOption.update({
        where: { id },
        data: { archivedAt: new Date() },
      });
      await logAudit({
        userId: r.session!.user.id,
        action: "SOFT_DELETE",
        entityType: "SizeOption",
        entityId: id,
        metadata: { label: row.label },
        ip,
      });
      return NextResponse.json({ data: row });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "تعذر الأرشفة" }, { status: 400 });
    }
  }

  const data: {
    label?: string;
    type?: "STANDARD" | "LETTER" | "NUMBER";
    sortOrder?: number;
  } = {};
  if (json.label !== undefined) {
    const label = normalizeSizeLabel(String(json.label));
    if (!isValidSizeLabel(label)) {
      return NextResponse.json({ error: "الاسم غير صالح" }, { status: 400 });
    }
    data.label = label;
  }
  if (json.type !== undefined) {
    const type = parseSizeOptionType(json.type);
    if (!type) {
      return NextResponse.json({ error: "نوع المقاس غير صالح" }, { status: 400 });
    }
    data.type = type;
  }
  if (json.sortOrder !== undefined && Number.isFinite(Number(json.sortOrder))) {
    data.sortOrder = clampSizeSortOrder(Number(json.sortOrder));
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا حقول للتحديث" }, { status: 400 });
  }
  try {
    const row = await prisma.sizeOption.update({
      where: { id },
      data,
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "UPDATE",
      entityType: "SizeOption",
      entityId: id,
      ip,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر التحديث" }, { status: 400 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const { id } = await ctx.params;
  const ip = getClientIp(req);
  try {
    const row = await prisma.sizeOption.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "SOFT_DELETE",
      entityType: "SizeOption",
      entityId: id,
      metadata: { label: row.label },
      ip,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر الأرشفة" }, { status: 400 });
  }
}
