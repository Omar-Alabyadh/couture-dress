import { NextResponse } from "next/server";
import { listAuditLog } from "@/server/services/auditService";
import { requireAuditAccess } from "@/lib/api/admin-auth";

export async function GET() {
  const r = await requireAuditAccess();
  if (r.error) return r.error;
  try {
    const data = await listAuditLog(400);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}
