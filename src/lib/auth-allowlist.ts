import type { UserRole } from "@/generated/prisma/client";

function parseList(v: string | undefined): string[] {
  return (v ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getOwnerEmails(): string[] {
  return parseList(process.env.OWNER_EMAILS ?? process.env.OWNER_EMAIL);
}

export function getEngineerEmails(): string[] {
  return parseList(process.env.ENGINEER_EMAILS);
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
