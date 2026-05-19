import { statSync } from "node:fs";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Cached singleton + bundle mtime so dev HMR does not keep a stale client after `prisma generate`. */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaGeneratedClientMtimeMs?: number;
};

function generatedPrismaClientMtimeMs(): number {
  try {
    return statSync(
      join(process.cwd(), "src", "generated", "prisma", "client.ts"),
    ).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Supabase transaction pooler (:6543) requires `pgbouncer=true` for Prisma.
 * Vercel env copies often omit it — queries then fail with opaque 500s in admin APIs.
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const isSupabasePooler =
      url.hostname.includes("pooler.supabase.com") || url.port === "6543";
    if (isSupabasePooler && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    if (process.env.VERCEL && !url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

function createClient(): PrismaClient {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is required for Prisma (set it in .env or .env.local).");
  }
  const connectionString = normalizeDatabaseUrl(raw);
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

function getPrismaSync(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    const bundleMtime = generatedPrismaClientMtimeMs();
    if (
      globalForPrisma.prisma &&
      globalForPrisma.prismaGeneratedClientMtimeMs !== bundleMtime
    ) {
      void globalForPrisma.prisma.$disconnect();
      globalForPrisma.prisma = undefined;
    }
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient();
      globalForPrisma.prismaGeneratedClientMtimeMs = bundleMtime;
    }
    return globalForPrisma.prisma;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: importing this module must not throw when DATABASE_URL is missing at cold start.
// Dynamic pages wrap DB calls in try/catch; errors should occur on first query, not at import time.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaSync();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
