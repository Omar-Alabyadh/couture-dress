export type SortDirection = "newest" | "oldest";

export type PaginateResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function paginateList<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginateResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

export function sortByDateString<T extends { createdAt?: string | null }>(
  items: T[],
  direction: SortDirection,
): T[] {
  return [...items].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return direction === "newest" ? tb - ta : ta - tb;
  });
}

export function normalizeSearch(q: string): string {
  return q.trim().toLowerCase();
}
