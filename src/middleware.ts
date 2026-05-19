import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { resolveAuthSecret } from "@/lib/auth-secret";

/**
 * Edge middleware must not import `auth.ts` (Prisma). Use the same Auth.js config
 * so session cookies decode identically to `/api/auth/session`.
 */
const { auth } = NextAuth({
  ...authConfig,
  secret: resolveAuthSecret(),
});

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
