import { prisma } from "@/server/db/client";
import type { UserRole } from "@/generated/prisma/client";

const DB_RETRY_ATTEMPTS = 3;
const DB_RETRY_BASE_MS = 120;

async function withDbRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < DB_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt < DB_RETRY_ATTEMPTS - 1) {
        await new Promise((r) =>
          setTimeout(r, DB_RETRY_BASE_MS * (attempt + 1)),
        );
        continue;
      }
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[auth] ${label} failed after ${DB_RETRY_ATTEMPTS} attempts:`, msg);
    }
  }
  throw last;
}

export async function syncOAuthUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
  role: UserRole;
}) {
  return withDbRetry("user upsert", () =>
    prisma.user.upsert({
      where: { email: params.email },
      create: {
        email: params.email,
        name: params.name,
        image: params.image,
        role: params.role,
      },
      update: {
        name: params.name,
        image: params.image,
        role: params.role,
      },
    }),
  );
}

export async function findUserByEmail(email: string) {
  return withDbRetry("user find", () =>
    prisma.user.findUnique({ where: { email } }),
  );
}

export async function findUserById(id: string) {
  return withDbRetry("user find by id", () =>
    prisma.user.findUnique({ where: { id } }),
  );
}
