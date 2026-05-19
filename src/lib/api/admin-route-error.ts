import { NextResponse } from "next/server";

/** Logs server-side and returns the standard admin load error JSON. */
export function adminLoadErrorResponse(label: string, e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`[admin-api] ${label}:`, msg);
  return NextResponse.json({ error: "تعذر التحميل" }, { status: 500 });
}
