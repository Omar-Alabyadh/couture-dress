import { NextResponse } from "next/server";
import { getDatabaseDiagnostics, prisma } from "@/server/db/client";

/** Production diagnostics — no secrets; safe to call when admin APIs return 500. */
export async function GET() {
  const hasUrl = Boolean(process.env.DATABASE_URL?.trim());
  if (!hasUrl) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not set on this deployment." },
      { status: 503 },
    );
  }

  const db = getDatabaseDiagnostics();

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      userCount,
      db: db
        ? { mode: db.mode, poolMax: db.poolMax, hint: db.hint ?? null }
        : null,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[health/db]", msg);

    const sessionPoolExhausted =
      msg.includes("EMAXCONNSESSION") || msg.includes("max clients reached");

    return NextResponse.json(
      {
        ok: false,
        error: "Database query failed",
        detail: msg,
        db: db
          ? { mode: db.mode, poolMax: db.poolMax, hint: db.hint ?? null }
          : null,
        fix: sessionPoolExhausted
          ? "On Vercel, set DATABASE_URL to Supabase Transaction pooler (port 6543), not Session (5432). Supabase → Project Settings → Database → Connection string → Transaction mode."
          : undefined,
      },
      { status: 503 },
    );
  }
}
