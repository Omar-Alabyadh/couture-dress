import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import { ensureDefaultSizeOptions } from "@/server/services/ensureDefaultSizeOptions";
import { isRecord } from "@/lib/validation/record";
import {
  clampSizeSortOrder,
  isValidSizeLabel,
  normalizeSizeLabel,
  parseSizeOptionType,
} from "@/lib/validation/size-input";
import { prepareSizeSortOrderInsert } from "@/server/services/sortOrderShiftService";

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    await ensureDefaultSizeOptions();
    const data = await prisma.sizeOption.findMany({
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    });
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
  const label = normalizeSizeLabel(String(json.label ?? ""));
  if (!isValidSizeLabel(label)) {
    return NextResponse.json({ error: "الاسم مطلوب أو طويل جدًا" }, { status: 400 });
  }
  const type = parseSizeOptionType(json.type);
  if (!type) {
    return NextResponse.json({ error: "نوع المقاس غير صالح" }, { status: 400 });
  }
  const sortOrder = clampSizeSortOrder(
    Number.isFinite(Number(json.sortOrder)) ? Number(json.sortOrder) : 0,
  );
  try {
    const row = await prisma.$transaction(async (tx) => {
      await prepareSizeSortOrderInsert(type, sortOrder, tx);
      return tx.sizeOption.create({
        data: { label, type, sortOrder, archivedAt: null },
      });
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "CREATE",
      entityType: "SizeOption",
      entityId: row.id,
      metadata: { label, type },
      ip,
    });
    return NextResponse.json({ data: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "تعذر الإنشاء — قد يكون المقاس موجودًا مسبقًا." },
      { status: 500 },
    );
  }
}
