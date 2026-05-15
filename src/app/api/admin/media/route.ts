import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import { getClientIp } from "@/lib/api/get-client-ip";
import { MediaStorageConfigError } from "@/lib/media/storage";
import {
  normalizeOptionalAlt,
  parseMediaUsageType,
} from "@/lib/media/validation";
import { logAudit } from "@/server/services/auditService";
import {
  MediaServiceError,
  listMediaForAdmin,
  mediaServiceErrorStatus,
  parseMediaListFilters,
  uploadMediaForAdmin,
} from "@/server/services/mediaService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const r = await requireOwner();
  if (r.error) return r.error;

  try {
    const { searchParams } = new URL(req.url);
    const filters = parseMediaListFilters(searchParams);
    const usageRaw = searchParams.get("usageType");
    if (usageRaw && !filters.usageType) {
      return NextResponse.json({ error: "نوع الاستخدام غير صالح" }, { status: 400 });
    }
    const result = await listMediaForAdmin(filters);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const ip = getClientIp(req);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "الملف مطلوب." }, { status: 400 });
  }

  const usageTypeRaw = form.get("usageType");
  const usageType = usageTypeRaw
    ? parseMediaUsageType(String(usageTypeRaw))
    : null;
  if (usageTypeRaw && !usageType) {
    return NextResponse.json({ error: "نوع الاستخدام غير صالح" }, { status: 400 });
  }

  const folderRaw = form.get("folder");
  const altRaw = form.get("alt");

  let buffer: Buffer;
  try {
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
  } catch {
    return NextResponse.json({ error: "تعذر قراءة الملف." }, { status: 400 });
  }

  try {
    const data = await uploadMediaForAdmin({
      file,
      buffer,
      usageType,
      folder: folderRaw != null ? String(folderRaw) : null,
      alt: normalizeOptionalAlt(altRaw),
      createdById: r.session!.user.id,
    });

    await logAudit({
      userId: r.session!.user.id,
      action: "CREATE",
      entityType: "MediaAsset",
      entityId: data.id,
      metadata: {
        path: data.path,
        folder: data.folder,
        usageType: data.usageType,
      },
      ip,
    });

    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof MediaServiceError) {
      return NextResponse.json(
        { error: e.message },
        { status: mediaServiceErrorStatus(e.code) },
      );
    }
    if (e instanceof MediaStorageConfigError) {
      return NextResponse.json({ error: e.message }, { status: 503 });
    }
    console.error(e);
    return NextResponse.json({ error: "تعذر الرفع" }, { status: 500 });
  }
}
