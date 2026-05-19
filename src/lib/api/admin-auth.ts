import { auth } from "@/auth";
import { isAllowedAppUser, resolveRoleForEmail } from "@/lib/auth-allowlist";
import { findUserByEmail } from "@/lib/auth-db";
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

/** Ensures session has DB user id + role (JWT may omit id after a transient DB error at login). */
async function hydrateSession(session: Session): Promise<Session | null> {
  const email = session.user?.email?.trim().toLowerCase();
  if (!email || !isAllowedAppUser(email)) return null;

  let id = session.user?.id;
  let role = roleFromSession(session);

  if (!hasValidUserId(id)) {
    try {
      const row = await findUserByEmail(email);
      if (row) {
        id = row.id;
        role = row.role;
      }
    } catch (e) {
      console.error("[auth] hydrateSession findUser:", e);
    }
  }

  if (!hasValidUserId(id) || !role) return null;

  return {
    ...session,
    user: {
      ...session.user,
      id: id!,
      role,
      email,
    },
  };
}

export async function requireSession() {
  const raw = await auth();
  if (!raw?.user?.email) {
    return {
      session: null,
      error: NextResponse.json({ error: "غير مصرّح — سجّلي الدخول من جديد." }, { status: 401 }),
    };
  }

  const session = await hydrateSession(raw);
  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "تعذّر التحقق من حسابك. سجّلي خروجًا ثم ادخلي من جديد." },
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
      error: NextResponse.json({ error: "غير مسموح بهذا الإجراء." }, { status: 403 }),
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
      error: NextResponse.json({ error: "غير مسموح بهذا الإجراء." }, { status: 403 }),
    };
  }
  return { session: r.session, error: null };
}
