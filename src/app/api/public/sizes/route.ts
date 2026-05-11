import { NextResponse } from "next/server";
import { getFilterSizes } from "@/server/services/contentService";

export async function GET() {
  try {
    const data = await getFilterSizes();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "تعذر تحميل المقاسات" },
      { status: 500 },
    );
  }
}
