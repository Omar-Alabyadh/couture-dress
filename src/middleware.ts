import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/generated/prisma/client";
import { resolveAuthSecret } from "@/lib/auth-secret";

/**
 * Auth.js session cookies use the `__Secure-` prefix on HTTPS (see
 * `@auth/core` defaultCookies). `getToken` defaults `secureCookie` to false,
 * which makes it look for `authjs.session-token` — missing on production —
 * so the token is always null and admin pages redirect to login even when
 * `/api/auth/session` works (that route uses the correct cookie names).
 */
function shouldUseSecureSessionCookie(req: NextRequest): boolean {
  if (req.nextUrl.protocol === "https:") return true;
  const xf = req.headers.get("x-forwarded-proto");
  const first = xf?.split(",")[0]?.trim();
  return first === "https";
}

function isGet(req: NextRequest) {
  return req.method === "GET" || req.method === "HEAD";
}

function isAuditApi(p: string) {
  return p === "/api/admin/audit-log";
}

export async function middleware(req: NextRequest) {
  /**
   * Emergency bypass: when `SITE_RECOVERY=1`, admin and `/api/admin` routes are not
   * auth-gated. Keep unset in production; see deployment runbooks / ops docs.
   */
  if (process.env.SITE_RECOVERY === "1") {
    return NextResponse.next();
  }

  const p = req.nextUrl.pathname;

  if (p === "/admin/login" || p.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (!p.startsWith("/admin") && !p.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const secureCookie = shouldUseSecureSessionCookie(req);
  const t = await getToken({
    req,
    secret: resolveAuthSecret(),
    secureCookie,
  });
  if (process.env.AUTH_MIDDLEWARE_DEBUG === "1") {
    console.log("[middleware] admin auth:", {
      hasToken: Boolean(t),
      email: typeof t?.email === "string" ? t.email : undefined,
      role: typeof t?.role === "string" ? t.role : undefined,
      secureCookie,
    });
  }
  if (!t) {
    if (p.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(
      new URL(
        `/admin/login?callbackUrl=${encodeURIComponent(p + req.nextUrl.search)}`,
        req.url,
      ),
    );
  }
  const role = t.role as UserRole | undefined;
  if (p.startsWith("/api/admin")) {
    if (isAuditApi(p)) {
      if (!isGet(req) && role !== "OWNER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (
        isGet(req) &&
        role !== "OWNER" &&
        role !== "ENGINEER"
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }
  if (p.startsWith("/admin")) {
    if (role === "ENGINEER") {
      if (p === "/admin/audit" || p.startsWith("/admin/audit/")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/admin/audit", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
