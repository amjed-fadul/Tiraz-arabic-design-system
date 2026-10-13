/** Internal display normalization; it never updates the caller's state. */
export function normalizePagination(page: number, totalPages: number) {
  const total = Number.isFinite(totalPages)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, Math.floor(totalPages)))
    : 1;
  const current = Number.isFinite(page)
    ? Math.max(1, Math.min(total, Math.floor(page)))
    : 1;
  return { page: current, totalPages: total };
}
export function paginationRange(
  page: number,
  total: number,
): Array<number | "start-gap" | "end-gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "end-gap", total];
  if (page >= total - 3)
    return [1, "start-gap", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "start-gap", page - 1, page, page + 1, "end-gap", total];
}
