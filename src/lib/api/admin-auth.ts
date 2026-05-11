import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@/generated/prisma/client";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireOwner() {
  const r = await requireSession();
  if (r.error) return r;
  if (r.session!.user.role !== "OWNER") {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session: r.session, error: null };
}

export async function requireAuditAccess() {
  const r = await requireSession();
  if (r.error) return r;
  const role = r.session!.user.role as UserRole;
  if (role !== "OWNER" && role !== "ENGINEER") {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session: r.session, error: null };
}
