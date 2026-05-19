import type { UserRole } from "@/generated/prisma/client";

/** Treat blank env values as unset (Vercel often defines keys with empty strings). */
function envValue(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t ? t : undefined;
}

function normalizeEmailEntry(raw: string): string {
  let e = raw.trim().toLowerCase();
  if (
    (e.startsWith('"') && e.endsWith('"')) ||
    (e.startsWith("'") && e.endsWith("'"))
  ) {
    e = e.slice(1, -1).trim();
  }
  return e;
}

function parseList(v: string | undefined): string[] {
  return (v ?? "")
    .split(",")
    .map(normalizeEmailEntry)
    .filter(Boolean);
}

/**
 * Parse a comma-separated allowlist, falling back when the primary env is
 * defined but empty (same class of bug as empty AUTH_SECRET blocking fallback).
 */
function parseEnvList(
  primary: string | undefined,
  fallback?: string | undefined,
): string[] {
  const fromPrimary = parseList(envValue(primary));
  if (fromPrimary.length > 0) return fromPrimary;
  return parseList(envValue(fallback));
}

export function getOwnerEmails(): string[] {
  return parseEnvList(process.env.OWNER_EMAILS, process.env.OWNER_EMAIL);
}

export function getEngineerEmails(): string[] {
  return parseEnvList(process.env.ENGINEER_EMAILS);
}

export function isAllowlistConfigured(): boolean {
  return getOwnerEmails().length > 0 || getEngineerEmails().length > 0;
}

export function isAllowedAppUser(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  return getOwnerEmails().includes(e) || getEngineerEmails().includes(e);
}

export function resolveRoleForEmail(email: string): UserRole {
  const e = email.toLowerCase();
  if (getOwnerEmails().includes(e)) return "OWNER";
  if (getEngineerEmails().includes(e)) return "ENGINEER";
  return "ENGINEER";
}

type OAuthAccount = {
  id_token?: string | null;
  access_token?: string | null;
};

function normalizeOAuthEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

/** Decode email from Google `id_token` (always present after a successful code exchange). */
export function emailFromIdToken(idToken: string | null | undefined): string | null {
  if (!idToken?.trim()) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(payload, "base64").toString("utf8");
    const claims = JSON.parse(json) as { email?: unknown };
    return normalizeOAuthEmail(claims.email);
  } catch {
    return null;
  }
}

/** Last-resort: Google userinfo when user/profile omit email (e.g. silent `prompt=none`). */
export async function emailFromGoogleUserinfo(
  accessToken: string | null | undefined,
): Promise<string | null> {
  if (!accessToken?.trim()) return null;
  try {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: unknown };
    return normalizeOAuthEmail(data.email);
  } catch {
    return null;
  }
}

/** Resolve OAuth sign-in email from user, profile, and token claims. */
export function resolveOAuthSignInEmail(
  user: { email?: string | null } | null | undefined,
  profile: unknown,
  account?: OAuthAccount | null,
): string | null {
  const fromUser = normalizeOAuthEmail(user?.email);
  if (fromUser) return fromUser;

  if (profile && typeof profile === "object" && profile !== null) {
    const fromProfile = normalizeOAuthEmail(
      (profile as { email?: unknown }).email,
    );
    if (fromProfile) return fromProfile;
  }

  const fromIdToken = emailFromIdToken(account?.id_token);
  if (fromIdToken) return fromIdToken;

  return null;
}

/** Async resolver — fetches Google userinfo only when sync sources miss email. */
export async function resolveOAuthSignInEmailAsync(
  user: { email?: string | null } | null | undefined,
  profile: unknown,
  account?: OAuthAccount | null,
): Promise<string | null> {
  const sync = resolveOAuthSignInEmail(user, profile, account);
  if (sync) return sync;
  return emailFromGoogleUserinfo(account?.access_token);
}
