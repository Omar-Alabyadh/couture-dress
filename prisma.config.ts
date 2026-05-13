import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI (migrate, db pull, …) needs a direct Postgres connection.
 * Supabase: use port 5432 on `db.<project>.supabase.co` (or session pooler on :5432), not the transaction pooler (:6543).
 * Runtime pooling stays on `DATABASE_URL` in `src/server/db/client.ts`.
 */
function prismaCliDatasourceUrl(): string {
  const direct = process.env.DIRECT_URL;
  if (direct) return direct;
  const fallback = process.env.DATABASE_URL;
  if (fallback) return fallback;
  throw new Error(
    "Set DIRECT_URL for Prisma Migrate (Supabase direct/session URL), or DATABASE_URL as a fallback.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: prismaCliDatasourceUrl(),
  },
});
