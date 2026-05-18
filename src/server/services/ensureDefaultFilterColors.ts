import { prisma } from "@/server/db/client";
import { DEFAULT_FILTER_COLORS } from "@/lib/admin/default-filter-colors";

/**
 * Inserts missing default filter colors (matched by trimmed label, case-insensitive).
 * Safe to call on every admin colors list load.
 */
export async function ensureDefaultFilterColors(): Promise<void> {
  const existing = await prisma.color.findMany({
    select: { label: true },
  });
  const labels = new Set(
    existing.map((c) => c.label.trim().toLowerCase()),
  );

  for (const item of DEFAULT_FILTER_COLORS) {
    const key = item.label.trim().toLowerCase();
    if (labels.has(key)) continue;
    await prisma.color.create({
      data: {
        label: item.label.trim(),
        hex: item.hex.toLowerCase(),
        sortOrder: item.sortOrder,
        deletedAt: null,
      },
    });
    labels.add(key);
  }
}
