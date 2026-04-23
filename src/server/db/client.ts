import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// AR: نستخدم singleton لتجنب تعدد اتصالات Prisma أثناء التطوير.
// EN: Use a singleton Prisma client to avoid extra connections in dev.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
