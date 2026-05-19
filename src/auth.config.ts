import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";
import type { UserRole } from "@/generated/prisma/client";

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

      const role = (auth.user as { role?: UserRole }).role;

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
