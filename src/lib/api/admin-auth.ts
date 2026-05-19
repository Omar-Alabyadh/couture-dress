import { auth } from "@/auth";
import { isAllowedAppUser, resolveRoleForEmail } from "@/lib/auth-allowlist";
import { findUserByEmail, syncOAuthUser } from "@/lib/auth-db";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { UserRole } from "@/generated/prisma/client";

function hasValidUserId(id: string | undefined | null): boolean {
  const t = id?.trim();
  return Boolean(t && t.length >= 8);
}

function roleFromSession(session: Session): UserRole | null {
  const role = session.user?.role;
  if (role === "OWNER" || role === "ENGINEER") return role;
  const email = session.user?.email?.trim().toLowerCase();
  if (email && isAllowedAppUser(email)) return resolveRoleForEmail(email);
  return null;
}

/**
 * Resolve admin session for API routes. Does not fail when JWT lacks id (reads still work).
 * Mutations should call `ensureSessionUserId` before audit writes.
 */
async function resolveAdminSession(
  raw: Session | null,
): Promise<Session | null> {
  const email = raw?.user?.email?.trim().toLowerCase();
  if (!email || !isAllowedAppUser(email)) return null;

  const role = roleFromSession(raw!);
  if (!role) return null;

  let id = hasValidUserId(raw!.user?.id) ? raw!.user!.id.trim() : "";

  if (!hasValidUserId(id)) {
    try {
      const row = await findUserByEmail(email);
      if (row) id = row.id;
    } catch (e) {
      console.error("[auth] resolveAdminSession:", e);
    }
  }

  return {
    ...raw!,
    user: {
      ...raw!.user,
      id,
      email,
      role,
    },
  };
}

/** Ensures a DB user id for audit logs / FK writes. */
export async function ensureSessionUserId(session: Session): Promise<string | null> {
  if (hasValidUserId(session.user.id)) return session.user.id.trim();

  const email = session.user.email?.trim().toLowerCase();
  if (!email || !isAllowedAppUser(email)) return null;

  try {
    const row = await syncOAuthUser({
      email,
      name: session.user.name,
      image: session.user.image,
      role: roleFromSession(session) ?? resolveRoleForEmail(email),
    });
    return row.id;
  } catch (e) {
    console.error("[auth] ensureSessionUserId:", e);
    return null;
  }
}

export async function requireSession() {
  const raw = await auth();
  const session = await resolveAdminSession(raw);
  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "غير مصرّح — سجّلي الدخول من جديد." },
        { status: 401 },
      ),
    };
  }
  return { session, error: null };
}

export async function requireOwner() {
  const r = await requireSession();
  if (r.error) return r;
  if (r.session!.user.role !== "OWNER") {
    return {
      session: null,
      error: NextResponse.json(
        { error: "غير مسموح بهذا الإجراء." },
        { status: 403 },
      ),
    };
  }
  return { session: r.session, error: null };
}

export async function requireAuditAccess() {
  const r = await requireSession();
  if (r.error) return r;
  const role = r.session!.user.role;
  if (role !== "OWNER" && role !== "ENGINEER") {
    return {
      session: null,
      error: NextResponse.json(
        { error: "غير مسموح بهذا الإجراء." },
        { status: 403 },
      ),
    };
  }
  return { session: r.session, error: null };
}
