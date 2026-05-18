import { prisma } from "@/server/db/client";
import { DEFAULT_SIZE_OPTIONS } from "@/lib/admin/default-size-options";

/**
 * Inserts missing default sizes (matched by type + trimmed label).
 * Safe to call on every admin sizes list load.
 */
export async function ensureDefaultSizeOptions(): Promise<void> {
  const existing = await prisma.sizeOption.findMany({
    select: { type: true, label: true },
  });
  const keys = new Set(
    existing.map((s) => `${s.type}::${s.label.trim().toLowerCase()}`),
  );

  for (const item of DEFAULT_SIZE_OPTIONS) {
    const key = `${item.type}::${item.label.trim().toLowerCase()}`;
    if (keys.has(key)) continue;
    await prisma.sizeOption.create({
      data: {
        label: item.label.trim(),
        type: item.type,
        sortOrder: item.sortOrder,
        archivedAt: null,
      },
    });
    keys.add(key);
  }
}
