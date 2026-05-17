import { serializeMediaAsset } from "@/lib/media/selectors";
import type { MediaAssetDto } from "@/lib/media/types";
import { prisma } from "@/server/db/client";

export type MediaStatsResult = {
  activeCount: number;
  archivedCount: number;
  totalSizeBytesActive: number;
  countByUsageType: Record<string, number>;
  countByFolder: Record<string, number>;
  latestUploads: MediaAssetDto[];
};

export async function getMediaStatsForAdmin(): Promise<MediaStatsResult> {
  const [
    activeCount,
    archivedCount,
    sizeAgg,
    usageGroups,
    folderGroups,
    latestRows,
  ] = await Promise.all([
    prisma.mediaAsset.count({ where: { isArchived: false } }),
    prisma.mediaAsset.count({ where: { isArchived: true } }),
    prisma.mediaAsset.aggregate({
      where: { isArchived: false },
      _sum: { sizeBytes: true },
    }),
    prisma.mediaAsset.groupBy({
      by: ["usageType"],
      where: { isArchived: false },
      _count: { _all: true },
    }),
    prisma.mediaAsset.groupBy({
      by: ["folder"],
      where: { isArchived: false },
      _count: { _all: true },
    }),
    prisma.mediaAsset.findMany({
      where: { isArchived: false },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
    }),
  ]);

  const countByUsageType: Record<string, number> = {};
  for (const g of usageGroups) {
    countByUsageType[g.usageType] = g._count._all;
  }

  const countByFolder: Record<string, number> = {};
  for (const g of folderGroups) {
    countByFolder[g.folder] = g._count._all;
  }

  return {
    activeCount,
    archivedCount,
    totalSizeBytesActive: sizeAgg._sum.sizeBytes ?? 0,
    countByUsageType,
    countByFolder,
    latestUploads: latestRows.map(serializeMediaAsset),
  };
}
