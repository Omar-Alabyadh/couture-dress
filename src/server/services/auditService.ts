import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";

type LogParams = {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
};

export async function logAudit(p: LogParams) {
  await prisma.auditLog.create({
    data: {
      userId: p.userId,
      action: p.action,
      entityType: p.entityType,
      entityId: p.entityId ?? null,
      metadata: p.metadata,
      ip: p.ip ?? null,
    },
  });
}

export async function listAuditLog(take = 300) {
  return prisma.auditLog.findMany({
    take,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, image: true } },
    },
  });
}
