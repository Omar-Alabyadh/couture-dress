import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import {
  permanentlyDeleteArchivedItem,
  type TrashEntityType,
} from "@/server/services/archiveTrashService";
import { isRecord } from "@/lib/validation/record";

const VALID_TYPES: TrashEntityType[] = [
  "product",
  "brand",
  "testimonial",
  "color",
  "size",
  "media",
  "category",
];

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
  const entityType = String(json.entityType ?? "") as TrashEntityType;
  const id = String(json.id ?? "").trim();
  if (!VALID_TYPES.includes(entityType) || !id) {
    return NextResponse.json({ error: "نوع أو معرّف غير صالح" }, { status: 400 });
  }
  try {
    await permanentlyDeleteArchivedItem(entityType, id);
    await logAudit({
      userId: r.session!.user.id,
      action: "DELETE",
      entityType: "TrashItem",
      entityId: id,
      metadata: { entityType },
      ip,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "العنصر غير موجود أو غير مؤرشف" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "تعذر الحذف النهائي — قد يكون العنصر مرتبطًا ببيانات أخرى." },
      { status: 400 },
    );
  }
}
