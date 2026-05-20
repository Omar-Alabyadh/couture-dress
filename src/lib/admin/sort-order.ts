/** Next sortOrder for a new row: max existing + 1 (0 when list is empty). */
export function nextSortOrder(
  items: readonly { sortOrder: number }[],
): number {
  if (items.length === 0) return 0;
  let max = -1;
  for (const row of items) {
    const n = row.sortOrder;
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

/** API/DB uses 0-based sortOrder; admin UI shows 1-based for non-technical users. */
export function sortOrderToAdminDisplay(internal: number): number {
  if (!Number.isFinite(internal)) return 1;
  return Math.max(0, Math.trunc(internal)) + 1;
}

export function sortOrderFromAdminDisplay(raw: unknown): number {
  const n =
    typeof raw === "string" ? parseInt(raw.trim(), 10) : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n) - 1);
}

export function sortOrderToAdminDisplayString(internal: number): string {
  return String(sortOrderToAdminDisplay(internal));
}

/** Suggested slot for a new row in admin forms (1-based display). */
export function nextSortOrderForAdminDisplay(
  items: readonly { sortOrder: number }[],
): number {
  return sortOrderToAdminDisplay(nextSortOrder(items));
}
