import { statSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Cached singleton + bundle mtime so dev HMR does not keep a stale client after `prisma generate`. */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
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
 * Do NOT set connection_limit=1 — admin routes use Promise.all (overview, products).
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const isSupabasePooler =
      url.hostname.includes("pooler.supabase.com") || url.port === "6543";
    if (isSupabasePooler && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    url.searchParams.delete("connection_limit");
    return url.toString();
  } catch {
    return connectionString;
  }
}

function createPool(): Pool {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is required for Prisma (set it in .env or .env.local).");
  }
  return new Pool({
    connectionString: normalizeDatabaseUrl(raw),
    max: process.env.VERCEL ? 5 : 10,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 30_000,
    allowExitOnIdle: true,
  });
}

function createClient(pool: Pool): PrismaClient {
  const adapter = new PrismaPg(pool);
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
      void globalForPrisma.pool?.end();
      globalForPrisma.prisma = undefined;
      globalForPrisma.pool = undefined;
    }
    if (!globalForPrisma.prisma) {
      globalForPrisma.pool = createPool();
      globalForPrisma.prisma = createClient(globalForPrisma.pool);
      globalForPrisma.prismaGeneratedClientMtimeMs = bundleMtime;
    }
    return globalForPrisma.prisma;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.pool = createPool();
    globalForPrisma.prisma = createClient(globalForPrisma.pool);
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: importing this module must not throw when DATABASE_URL is missing at cold start.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaSync();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
