import type { JWT } from "next-auth/jwt";
import {
  isAllowedAppUser,
  resolveRoleForEmail,
} from "@/lib/auth-allowlist";
import { findUserByEmail, findUserById, syncOAuthUser } from "@/lib/auth-db";

type JwtUser = { email?: string | null; name?: string | null; image?: string | null };

/**
 * Enrich JWT with stable id + role from DB. On transient DB errors, keep prior token
 * claims so sessions do not flip between working and "تعذر التحميل".
 */
export async function enrichJwtFromDatabase(
  token: JWT,
  user?: JwtUser | null,
): Promise<JWT> {
  const email =
    user?.email?.trim().toLowerCase() ??
    (typeof token.email === "string" ? token.email.trim().toLowerCase() : undefined);

  const priorId = typeof token.id === "string" ? token.id : undefined;
  const priorRole = token.role;

  if (!email) {
    if (priorId) {
      try {
        const row = await findUserById(priorId);
        if (row) {
          token.id = row.id;
          token.role = row.role;
          token.email = row.email;
        }
      } catch (e) {
        console.error("[auth] jwt enrich by id:", e);
      }
    }
    return token;
  }

  token.email = email;

  try {
    let row = await findUserByEmail(email);
    if (!row && isAllowedAppUser(email)) {
      row = await syncOAuthUser({
        email,
        name: user?.name ?? null,
        image: user?.image ?? null,
        role: resolveRoleForEmail(email),
      });
    }
    if (row) {
      token.id = row.id;
      token.role = row.role;
      token.email = row.email;
      return token;
    }
    if (isAllowedAppUser(email)) {
      token.role = resolveRoleForEmail(email);
      if (priorId) token.id = priorId;
    }
    return token;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auth] jwt enrich failed (keeping prior claims):", msg);
    if (isAllowedAppUser(email)) {
      token.email = email;
      if (priorRole) token.role = priorRole;
      else token.role = resolveRoleForEmail(email);
      if (priorId) token.id = priorId;
    }
    return token;
  }
}
