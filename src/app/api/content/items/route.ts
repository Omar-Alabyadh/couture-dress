import { NextResponse } from "next/server";
import { getPublicCollectionItemsForHome } from "@/server/services/contentService";

export async function GET() {
  try {
    const items = await getPublicCollectionItemsForHome();
    return NextResponse.json({ data: items });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to fetch collection items.",
      },
      { status: 500 },
    );
  }
}
