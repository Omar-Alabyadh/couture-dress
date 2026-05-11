import { NextResponse } from "next/server";
import {
  getLandingForAdmin,
  saveLandingContent,
} from "@/server/services/landingService";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";
import {
  defaultLandingContent,
  LANDING_SETTING_KEY,
  parseLandingContent,
  type LandingContent,
} from "@/lib/types/landing";
import { prisma } from "@/server/db/client";
import { isRecord } from "@/lib/validation/record";

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    return NextResponse.json(await getLandingForAdmin());
  } catch {
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}

function parseBody(body: unknown): LandingContent | null {
  if (!isRecord(body)) return null;
  const merged = { ...defaultLandingContent(), ...body };
  if (
    typeof merged.heroTitleHtml !== "string" ||
    !merged.heroTitleHtml.trim()
  ) {
    return null;
  }
  let wire: string;
  try {
    wire = JSON.stringify(merged);
  } catch {
    return null;
  }
  if (wire.length > 200_000) {
    return null;
  }
  return parseLandingContent(wire);
}

export async function PUT(req: Request) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const ip = getClientIp(req);
  try {
    const json = (await req.json()) as unknown;
    const content = parseBody(json);
    if (!content) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    const before = await prisma.siteSetting.findUnique({
      where: { key: LANDING_SETTING_KEY },
    });
    const { content: saved } = await saveLandingContent(content);
    await logAudit({
      userId: r.session!.user.id,
      action: "UPDATE",
      entityType: "Landing",
      entityId: "landing_v1",
      metadata: { hasPrevious: Boolean(before) } as object,
      ip,
    });
    return NextResponse.json({ data: saved });
  } catch {
    return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 });
  }
}
