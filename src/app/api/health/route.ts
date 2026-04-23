import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "couture-dress",
    timestamp: new Date().toISOString(),
  });
}
