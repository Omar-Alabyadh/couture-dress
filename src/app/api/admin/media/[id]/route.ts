import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import { getClientIp } from "@/lib/api/get-client-ip";
import { isRecord } from "@/lib/validation/record";
import {
  normalizeFolderSegment,
  normalizeOptionalAlt,
  parseMediaUsageType,
} from "@/lib/media/validation";
import { logAudit } from "@/server/services/auditService";
import {
  MediaServiceError,
  archiveMediaForAdmin,
  mediaServiceErrorStatus,
  updateMediaForAdmin,
} from "@/server/services/mediaService";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function parsePatch(body: unknown): {
  alt?: string | null;
  folder?: string;
  usageType?: string;
  isArchived?: boolean;
} | null {
  if (!isRecord(body)) return null;
  const out: {
    alt?: string | null;
    folder?: string;
    usageType?: string;
    isArchived?: boolean;
  } = {};
  if (Object.prototype.hasOwnProperty.call(body, "alt")) {
    out.alt = body.alt === null ? null : String(body.alt);
  }
  if (body.folder !== undefined) {
    out.folder = String(body.folder);
  }
  if (body.usageType !== undefined) {
    out.usageType = String(body.usageType);
  }
  if (body.isArchived !== undefined) {
    out.isArchived = Boolean(body.isArchived);
  }
  return out;
}

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

  const p = parsePatch(json);
  if (!p) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  if (p.usageType !== undefined && !parseMediaUsageType(p.usageType)) {
    return NextResponse.json({ error: "نوع الاستخدام غير صالح" }, { status: 400 });
  }
  if (p.folder !== undefined && !normalizeFolderSegment(p.folder)) {
    return NextResponse.json({ error: "مجلد غير صالح" }, { status: 400 });
  }

  try {
    const data = await updateMediaForAdmin(id, {
      alt: p.alt !== undefined ? normalizeOptionalAlt(p.alt) : undefined,
      folder: p.folder,
      usageType:
        p.usageType !== undefined
          ? (parseMediaUsageType(p.usageType) ?? undefined)
          : undefined,
      isArchived: p.isArchived,
    });

    await logAudit({
      userId: r.session!.user.id,
      action: "UPDATE",
      entityType: "MediaAsset",
      entityId: id,
      metadata: { fields: Object.keys(p) },
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
    console.error(e);
    return NextResponse.json({ error: "تعذر التحديث" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const { id } = await ctx.params;
  const ip = getClientIp(_req);

  try {
    const data = await archiveMediaForAdmin(id);

    await logAudit({
      userId: r.session!.user.id,
      action: "SOFT_DELETE",
      entityType: "MediaAsset",
      entityId: id,
      metadata: { path: data.path },
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
    console.error(e);
    return NextResponse.json({ error: "تعذر الأرشفة" }, { status: 400 });
  }
}
