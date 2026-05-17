import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import { scanMediaAssetUsage } from "@/server/services/mediaUsageScanService";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const r = await requireOwner();
  if (r.error) return r.error;

  const { id } = await ctx.params;
  try {
    const data = await scanMediaAssetUsage(id);
    if (!data) {
      return NextResponse.json({ error: "الوسيط غير موجود." }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر فحص الاستخدام" }, { status: 500 });
  }
}
