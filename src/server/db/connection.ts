export type DatabaseUrlMode = "transaction-pooler" | "session-pooler" | "direct";

export type DatabaseUrlInfo = {
  mode: DatabaseUrlMode;
  normalized: string;
  /** pg `Pool.max` — must stay low on Vercel + Supabase */
  poolMax: number;
  hint?: string;
};

/**
 * Supabase on Vercel must use the **transaction** pooler (:6543) + `pgbouncer=true`.
 * Session pooler (:5432) shares ~15 connections — serverless bursts hit EMAXCONNSESSION.
 *
 * @see https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
 */
export function resolveDatabaseUrl(connectionString: string): DatabaseUrlInfo {
  try {
    const url = new URL(connectionString);
    const host = url.hostname;
    const isSupabasePooler = host.includes("pooler.supabase.com");
    const port = url.port || "5432";

    if (isSupabasePooler && port === "5432") {
      url.port = "6543";
      url.searchParams.set("pgbouncer", "true");
      if (process.env.VERCEL) {
        url.searchParams.set("connection_limit", "1");
      }
      return {
        mode: "transaction-pooler",
        normalized: url.toString(),
        poolMax: process.env.VERCEL ? 1 : 5,
        hint:
          "DATABASE_URL used Supabase session pooler (:5432). Runtime upgraded to transaction pooler (:6543). In Vercel, set DATABASE_URL to the :6543 URI from Supabase → Settings → Database.",
      };
    }

    if (isSupabasePooler && port === "6543") {
      url.searchParams.set("pgbouncer", "true");
      if (process.env.VERCEL) {
        url.searchParams.set("connection_limit", "1");
      }
      return {
        mode: "transaction-pooler",
        normalized: url.toString(),
        poolMax: process.env.VERCEL ? 1 : 5,
      };
    }

    if (isSupabasePooler) {
      return {
        mode: "session-pooler",
        normalized: url.toString(),
        poolMax: 1,
        hint: `Unexpected Supabase pooler port ${port}. Use :6543 (transaction mode) for Vercel.`,
      };
    }

    return {
      mode: "direct",
      normalized: url.toString(),
      poolMax: process.env.VERCEL ? 2 : 10,
    };
  } catch {
    return {
      mode: "direct",
      normalized: connectionString,
      poolMax: process.env.VERCEL ? 1 : 10,
    };
  }
}
