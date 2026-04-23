import { NextResponse } from "next/server";
import { getPublicCollectionItems } from "@/server/services/contentService";

export async function GET() {
  try {
    const items = await getPublicCollectionItems();
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
