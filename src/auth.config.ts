import type { NextAuthConfig } from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";
import {
  isAllowedAppUser,
  resolveRoleForEmail,
} from "@/lib/auth-allowlist";
import type { UserRole } from "@/generated/prisma/client";

/** Maps JWT claims to session — must live in auth.config for Edge middleware. */
export function applySessionFromToken(session: Session, token: JWT): Session {
  if (session.user) {
    const email =
      (typeof token.email === "string" ? token.email : session.user.email)?.trim().toLowerCase() ??
      "";

    session.user.id = typeof token.id === "string" ? token.id : "";
    if (token.email) {
      session.user.email = token.email as string;
    } else if (email) {
      session.user.email = email;
    }

    const tokenRole = token.role as UserRole | undefined;
    if (tokenRole === "OWNER" || tokenRole === "ENGINEER") {
      session.user.role = tokenRole;
    } else if (email && isAllowedAppUser(email)) {
      session.user.role = resolveRoleForEmail(email);
    } else {
      session.user.role = "ENGINEER";
    }
  }
  return session;
}

function resolveSessionRole(auth: Session | null): UserRole | undefined {
  const role = auth?.user?.role;
  if (role === "OWNER" || role === "ENGINEER") return role;
  const email = auth?.user?.email?.trim().toLowerCase();
  if (email && isAllowedAppUser(email)) return resolveRoleForEmail(email);
  return undefined;
}

function isGet(request: { method: string }) {
  return request.method === "GET" || request.method === "HEAD";
}

function isAuditApi(p: string) {
  return p === "/api/admin/audit-log";
}

/**
 * Edge-safe Auth.js config (no Prisma). Imported by `auth.ts` and bundled into
 * middleware so session cookies are read the same way as `/api/auth/session`.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Avoid silent `prompt=none` flows that sometimes omit profile email.
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      return applySessionFromToken(session, token);
    },
    authorized({ auth, request }) {
      if (process.env.SITE_RECOVERY === "1") return true;

      const p = request.nextUrl.pathname;
      if (p === "/admin/login" || p.startsWith("/api/auth/")) return true;
      if (!p.startsWith("/admin") && !p.startsWith("/api/admin")) return true;

      if (!auth?.user) {
        if (p.startsWith("/api/admin")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        return false;
      }

      const role = resolveSessionRole(auth);

      if (p.startsWith("/api/admin")) {
        if (isAuditApi(p)) {
          if (!isGet(request) && role !== "OWNER") {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
          if (
            isGet(request) &&
            role !== "OWNER" &&
            role !== "ENGINEER"
          ) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
          }
        } else if (role !== "OWNER") {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        return true;
      }

      if (p.startsWith("/admin") && role === "ENGINEER") {
        if (p === "/admin/audit" || p.startsWith("/admin/audit/")) {
          return true;
        }
        return NextResponse.redirect(new URL("/admin/audit", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
