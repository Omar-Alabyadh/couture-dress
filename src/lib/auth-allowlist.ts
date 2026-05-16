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

/** Resolve OAuth sign-in email from user and provider profile. */
export function resolveOAuthSignInEmail(
  user: { email?: string | null } | null | undefined,
  profile: unknown,
): string | null {
  const fromUser = user?.email?.trim();
  if (fromUser) return fromUser.toLowerCase();

  if (profile && typeof profile === "object" && profile !== null) {
    const pe = (profile as { email?: unknown }).email;
    if (typeof pe === "string" && pe.trim()) {
      return pe.trim().toLowerCase();
    }
  }

  return null;
}
