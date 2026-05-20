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
