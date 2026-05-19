import NextAuth from "next-auth";
import { applySessionFromToken, authConfig } from "@/auth.config";
import { resolveAuthSecret } from "@/lib/auth-secret";
import {
  emailFromIdToken,
  getEngineerEmails,
  getOwnerEmails,
  isAllowlistConfigured,
  isAllowedAppUser,
  resolveOAuthSignInEmailAsync,
  resolveRoleForEmail,
} from "@/lib/auth-allowlist";
import { enrichJwtFromDatabase } from "@/lib/auth-jwt";
import { syncOAuthUser } from "@/lib/auth-db";
import { logAudit } from "@/server/services/auditService";
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: resolveAuthSecret(),
  logger: {
    error(error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[auth]", msg);
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      const email = await resolveOAuthSignInEmailAsync(user, profile, account);
      if (!email || !isAllowedAppUser(email)) {
        if (process.env.AUTH_SIGNIN_DEBUG === "1") {
          console.warn("[auth] signIn denied", {
            hasUserEmail: Boolean(user?.email?.trim()),
            hasProfileEmail: Boolean(
              profile &&
                typeof profile === "object" &&
                typeof (profile as { email?: unknown }).email === "string",
            ),
            hasIdTokenEmail: Boolean(emailFromIdToken(account?.id_token)),
            allowlistConfigured: isAllowlistConfigured(),
            ownerCount: getOwnerEmails().length,
            engineerCount: getEngineerEmails().length,
          });
        }
        if (!isAllowlistConfigured()) {
          console.error(
            "[auth] signIn denied: OWNER_EMAIL / OWNER_EMAILS / ENGINEER_EMAILS not configured",
          );
        }
        return false;
      }

      const role = resolveRoleForEmail(email);
      try {
        const row = await syncOAuthUser({
          email,
          name: user.name,
          image: user.image,
          role,
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
        console.error(
          "[auth] signIn user upsert failed; allowing login — jwt will retry:",
          msg,
        );
      }
      return true;
    },
    async jwt({ token, user }): Promise<import("next-auth/jwt").JWT> {
      return enrichJwtFromDatabase(token, user);
    },
    async session({ session, token }) {
      return applySessionFromToken(session, token);
    },
  },
});
