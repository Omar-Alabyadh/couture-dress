import { prisma } from "@/server/db/client";

/** Active (non-archived) brand/designer row suitable for linking to a product. */
export async function resolveActiveBrandDesignerId(
  raw: unknown,
): Promise<string | null> {
  if (raw === null || raw === undefined || raw === "") return null;
  const id = String(raw).trim();
  if (!id) return null;
  const row = await prisma.brandDesigner.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  return row?.id ?? null;
}

export type BrandDesignerLinkOutcome =
  | { kind: "clear" }
  | { kind: "connect"; id: string }
  | { kind: "invalid" };

export async function resolveBrandDesignerLinkForProduct(
  raw: unknown,
): Promise<BrandDesignerLinkOutcome> {
  if (raw === null || raw === undefined || raw === "") {
    return { kind: "clear" };
  }
  const id = String(raw).trim();
  if (!id) return { kind: "clear" };
  const row = await prisma.brandDesigner.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!row) return { kind: "invalid" };
  return { kind: "connect", id: row.id };
}
