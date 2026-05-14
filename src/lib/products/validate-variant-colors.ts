import { prisma } from "@/server/db/client";

/** Ensures every non-null colorId exists and is not soft-deleted. */
export async function variantColorIdsExistOnDb(
  colorIds: ReadonlyArray<string | null>,
): Promise<boolean> {
  const ids: string[] = [];
  for (const c of colorIds) {
    if (c != null && String(c).trim()) ids.push(String(c).trim());
  }
  const uniq = [...new Set(ids)];
  if (uniq.length === 0) return true;
  const n = await prisma.color.count({
    where: { id: { in: uniq }, deletedAt: null },
  });
  return n === uniq.length;
}
