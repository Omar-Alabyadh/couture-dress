import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { requireOwner } from "@/lib/api/admin-auth";
import { logAudit } from "@/server/services/auditService";
import { getClientIp } from "@/lib/api/get-client-ip";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const r = await requireOwner();
  if (r.error) return r.error;
  const { id } = await ctx.params;
  const ip = getClientIp(req);
  try {
    await prisma.collectionItem.update({
      where: { id, NOT: { deletedAt: null } },
      data: { deletedAt: null },
    });
    await logAudit({
      userId: r.session!.user.id,
      action: "RESTORE",
      entityType: "Product",
      entityId: id,
      ip,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر الاسترجاع" }, { status: 400 });
  }
}
