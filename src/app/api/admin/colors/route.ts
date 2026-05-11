import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { listColorsForAdmin } from "@/server/repositories/contentRepository";
import { isRecord } from "@/lib/validation/record";
import {
  clampSortOrder,
  normalizeColorLabel,
  normalizeOptionalColorHex,
} from "@/lib/validation/color-input";

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    const data = await listColorsForAdmin();
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
  const label = normalizeColorLabel(String(json.label ?? ""));
  if (!label) {
    return NextResponse.json({ error: "الاسم مطلوب أو طويل جدًا" }, { status: 400 });
  }
  const hexParsed = normalizeOptionalColorHex(json.hex);
  if (!hexParsed.ok) {
    return NextResponse.json({ error: "قيمة hex غير صالحة" }, { status: 400 });
  }
  const hex = hexParsed.value;
  const sortOrder = clampSortOrder(
    Number.isFinite(Number(json.sortOrder)) ? Number(json.sortOrder) : 0,
  );
  try {
    const row = await prisma.color.create({
      data: { label, hex, sortOrder, deletedAt: null },
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "CREATE",
      entityType: "Color",
      entityId: row.id,
      metadata: { label },
      ip,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر الإنشاء" }, { status: 500 });
  }
}
