import { prisma } from "@/server/db/client";

export async function listCollectionItems() {
  return prisma.collectionItem.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
  });
}
