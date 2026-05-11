import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import { listTrashedCollection } from "@/server/repositories/contentRepository";

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    const data = await listTrashedCollection();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}
