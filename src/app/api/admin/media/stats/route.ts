import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import { getMediaStatsForAdmin } from "@/server/services/mediaStatsService";

export const runtime = "nodejs";

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;

  try {
    const data = await getMediaStatsForAdmin();
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر تحميل الإحصائيات" }, { status: 500 });
  }
}
