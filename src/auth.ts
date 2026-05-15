import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/server/db/client";
import { resolveAuthSecret } from "@/lib/auth-secret";
import {
  isAllowedAppUser,
  resolveRoleForEmail,
} from "@/lib/auth-allowlist";
import { logAudit } from "@/server/services/auditService";
import type { UserRole } from "@/generated/prisma/client";

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: resolveAuthSecret(),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  logger: {
    error(error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[auth]", msg);
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      const email = user?.email;
      if (!isAllowedAppUser(email)) {
        return false;
      }
      const role = resolveRoleForEmail(email!);
      try {
        const row = await prisma.user.upsert({
          where: { email: email!.toLowerCase() },
          create: {
            email: email!.toLowerCase(),
            name: user.name,
            image: user.image,
            role,
          },
          update: {
            name: user.name,
            image: user.image,
            role,
          },
        });
        try {
          await logAudit({
            userId: row.id,
            action: "LOGIN",
            entityType: "Auth",
            entityId: null,
            metadata: { provider: account?.provider ?? "google" },
          });
        } catch (e) {
          console.error("[auth] audit log", e);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[auth] signIn user upsert:", msg);
        throw e;
      }
      return true;
    },
    async jwt({ token, user }): Promise<import("next-auth/jwt").JWT> {
      try {
        const email =
          user?.email?.toLowerCase() ??
          (token.email as string | undefined)?.toLowerCase();
        if (email) {
          const row = await prisma.user.findUnique({
            where: { email },
          });
          if (row) {
            token.id = row.id;
            token.role = row.role;
            token.email = row.email;
          }
        } else if (token.id) {
          const row = await prisma.user.findUnique({
            where: { id: token.id as string },
          });
          if (row) {
            token.role = row.role;
          }
        }
        return token;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[auth] jwt callback:", msg);
        throw e;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as UserRole) ?? "ENGINEER";
        if (token.email) {
          session.user.email = token.email as string;
        }
      }
      return session;
    },
  },
});
