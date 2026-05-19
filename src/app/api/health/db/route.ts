import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";

/** Production diagnostics — no secrets; safe to call when admin APIs return 500. */
export async function GET() {
  const hasUrl = Boolean(process.env.DATABASE_URL?.trim());
  if (!hasUrl) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not set on this deployment." },
      { status: 503 },
    );
  }
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[health/db]", msg);
    return NextResponse.json(
      { ok: false, error: "Database query failed", detail: msg },
      { status: 503 },
    );
  }
}
