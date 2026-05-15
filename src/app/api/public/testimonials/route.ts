import { NextResponse } from "next/server";
import { getPublicTestimonialsForHome } from "@/server/services/contentService";

export async function GET() {
  try {
    const data = await getPublicTestimonialsForHome();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
  }
}
