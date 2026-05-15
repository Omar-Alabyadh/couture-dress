import type { MediaUsageType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";
import { decodeListCursor } from "@/lib/media/selectors";

export type MediaListQuery = {
  folder?: string;
  usageType?: MediaUsageType;
  archived: "false" | "true" | "all";
  q?: string;
  limit: number;
  cursor?: string | null;
};

export async function listMediaAssets(query: MediaListQuery) {
  const and: Prisma.MediaAssetWhereInput[] = [];

  if (query.archived === "false") {
    and.push({ isArchived: false });
  } else if (query.archived === "true") {
    and.push({ isArchived: true });
  }

  if (query.folder) {
    and.push({ folder: query.folder });
  }
  if (query.usageType) {
    and.push({ usageType: query.usageType });
  }

  if (query.q?.trim()) {
    const t = query.q.trim();
    and.push({
      OR: [
        { originalFilename: { contains: t, mode: "insensitive" } },
        { filename: { contains: t, mode: "insensitive" } },
        { alt: { contains: t, mode: "insensitive" } },
      ],
    });
  }

  const cursorPayload = decodeListCursor(query.cursor);
  if (cursorPayload) {
    and.push({
      OR: [
        { createdAt: { lt: new Date(cursorPayload.createdAt) } },
        {
          createdAt: new Date(cursorPayload.createdAt),
          id: { lt: cursorPayload.id },
        },
      ],
    });
  }

  const where: Prisma.MediaAssetWhereInput =
    and.length > 0 ? { AND: and } : {};

  const take = query.limit + 1;
  const rows = await prisma.mediaAsset.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
  });

  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  return { rows: page, hasMore };
}

export async function findMediaAssetById(id: string) {
  return prisma.mediaAsset.findUnique({ where: { id } });
}

export async function createMediaAsset(
  data: Prisma.MediaAssetCreateInput,
) {
  return prisma.mediaAsset.create({ data });
}

export async function updateMediaAsset(
  id: string,
  data: Prisma.MediaAssetUpdateInput,
) {
  return prisma.mediaAsset.update({ where: { id }, data });
}
