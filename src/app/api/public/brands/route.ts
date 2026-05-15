import { NextResponse } from "next/server";
import { getPublicBrandStripForHome } from "@/server/services/contentService";

export async function GET() {
  try {
    const data = await getPublicBrandStripForHome();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}
