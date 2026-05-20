/**
 * Assigns unique sequential sortOrder values (0, 1, 2, …) while preserving
 * current display order (sortOrder asc, then tie-breaker).
 */
export type RenumberPlanRow<T> = {
  item: T;
  from: number;
  to: number;
};

export function buildRenumberPlan<T extends { sortOrder: number }>(
  items: readonly T[],
  tieBreak: (a: T, b: T) => number = () => 0,
): RenumberPlanRow<T>[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort(
    (a, b) => a.sortOrder - b.sortOrder || tieBreak(a, b),
  );
  const plan: RenumberPlanRow<T>[] = [];
  sorted.forEach((item, index) => {
    if (item.sortOrder !== index) {
      plan.push({ item, from: item.sortOrder, to: index });
    }
  });
  return plan;
}

export function countDuplicateSortOrders(
  items: readonly { sortOrder: number }[],
): number {
  const seen = new Set<number>();
  let dupes = 0;
  for (const row of items) {
    if (seen.has(row.sortOrder)) dupes += 1;
    else seen.add(row.sortOrder);
  }
  return dupes;
}
