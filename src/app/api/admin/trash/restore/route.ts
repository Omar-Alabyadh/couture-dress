import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import { getClientIp } from "@/lib/api/get-client-ip";
import { logAudit } from "@/server/services/auditService";
import {
  restoreArchivedItem,
  type TrashEntityType,
} from "@/server/services/archiveTrashService";
import { isRecord } from "@/lib/validation/record";

const TYPES = new Set<TrashEntityType>([
  "product",
  "brand",
  "testimonial",
  "color",
  "media",
  "category",
]);

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
  if (!TYPES.has(entityType) || !id) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  try {
    await restoreArchivedItem(entityType, id);
    await logAudit({
      userId: r.session!.user.id,
      action: "RESTORE",
      entityType:
        entityType === "product"
          ? "Product"
          : entityType === "brand"
            ? "BrandDesigner"
            : entityType === "testimonial"
              ? "Testimonial"
              : entityType === "color"
                ? "Color"
                : entityType === "category"
                  ? "ProductCategory"
                  : "MediaAsset",
      entityId: id,
      metadata: { entityType },
      ip,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "غير موجود أو غير مؤرشف." }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json({ error: "تعذر الاسترجاع" }, { status: 400 });
  }
}
