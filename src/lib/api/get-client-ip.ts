import type { NextRequest } from "next/server";

export function getClientIp(req: Request | NextRequest): string | null {
  const h = req.headers;
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim() || null;
  }
  return h.get("x-real-ip");
}
