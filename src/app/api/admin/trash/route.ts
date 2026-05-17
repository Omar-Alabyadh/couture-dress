import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/api/admin-auth";
import { listArchivedItems } from "@/server/services/archiveTrashService";

export async function GET() {
  const r = await requireOwner();
  if (r.error) return r.error;
  try {
    const data = await listArchivedItems();
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}
