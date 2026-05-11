import { NextResponse } from "next/server";
import { listActiveColors } from "@/server/repositories/contentRepository";

export async function GET() {
  try {
    const data = await listActiveColors();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "تعذر تحميل الألوان" },
      { status: 500 },
    );
  }
}
