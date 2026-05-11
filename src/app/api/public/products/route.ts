import { NextResponse } from "next/server";
import { getPublicProducts } from "@/server/services/contentService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      q: searchParams.get("q") ?? undefined,
      name: searchParams.get("name") ?? undefined,
      size: searchParams.get("size") ?? undefined,
      colorId: searchParams.get("colorId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    };
    const data = await getPublicProducts(filters);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "تعذر تحميل المنتجات" }, { status: 500 });
  }
}
