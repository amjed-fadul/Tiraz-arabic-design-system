import { useMemo, useState } from "react";
import type { Key, ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Text sorting uses Intl.Collator with numeric ordering and base sensitivity. */
  sortValue?: (row: T) => string;
  rowHeader?: boolean;
}
export interface DataTableLabels {
  previous: string;
  next: string;
  pagination: string;
  sortAscending: (header: string) => string;
  sortDescending: (header: string) => string;
  resultCount: (from: number, to: number, total: number) => string;
}
export interface DataTableProps<T> {
  data: readonly T[];
  columns: readonly DataTableColumn<T>[];
  getRowId: (row: T) => Key;
  caption: string;
  locale: string;
  labels: DataTableLabels;
  emptyContent: ReactNode;
  /** Positive integer; defaults to 10. */
  pageSize?: number;
  /** Change when application filters change, including when the result count is unchanged. */
  resetKey?: string | number;
  loading?: boolean;
  /** Speak result counts politely, or leave announcements to the host. */
  announcement?: "polite" | "off";
}
/** Native Table with client-side text sorting and pagination. Filtering belongs to the caller. */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  caption,
  locale,
  labels,
  emptyContent,
  pageSize = 10,
  resetKey,
  loading = false,
  announcement = "polite",
}: DataTableProps<T>) {
  const size = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : 10;
  const [sort, setSort] = useState<{ id: string; descending: boolean } | null>(
    null,
  );
  const [paging, setPaging] = useState({ page: 1, resetKey, size });
  const pages = Math.max(1, Math.ceil(data.length / size));
  const page =
    paging.resetKey !== resetKey || paging.size !== size
      ? 1
      : Math.min(paging.page, pages);
  // Adjust during render so a shrink remains clamped even if records later grow.
  if (
    page !== paging.page ||
    paging.resetKey !== resetKey ||
    paging.size !== size
  ) {
    setPaging({ page, resetKey, size });
  }
  const sorted = useMemo(() => {
    const column = columns.find((column) => column.id === sort?.id);
    if (!column?.sortValue || !sort) return data;
    const collator = new Intl.Collator(locale, {
      numeric: true,
      sensitivity: "base",
    });
    const value = column.sortValue;
    return [...data].sort(
      (a, b) =>
        collator.compare(value(a), value(b)) * (sort.descending ? -1 : 1),
    );
  }, [data, columns, sort, locale]);
  const start = (page - 1) * size;
  return (
    <div className="tz-data-table">
      <Table
        caption={caption || undefined}
        aria-label={caption ? undefined : labels.pagination}
        aria-busy={loading}
      >
        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const selected = sort?.id === column.id;
              const descending = selected && !sort.descending;
              const Icon = selected
                ? sort.descending
                  ? ArrowDown
                  : ArrowUp
                : ArrowUpDown;
              return (
                <TableHead
                  key={column.id}
                  aria-sort={
                    column.sortValue
                      ? selected
                        ? sort.descending
                          ? "descending"
                          : "ascending"
                        : "none"
                      : undefined
                  }
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      className="tz-table-sort"
                      aria-label={
                        descending
                          ? labels.sortDescending(column.header)
                          : labels.sortAscending(column.header)
                      }
                      onClick={() => {
                        setSort({ id: column.id, descending });
                        setPaging({ page: 1, resetKey, size });
                      }}
                    >
                      {column.header}
                      <Icon size={14} aria-hidden="true" />
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            // A page of placeholder rows holds the table's shape while it
            // loads; aria-busy and the caller's status carry the meaning.
            Array.from({ length: size }, (_, index) => (
              <TableRow key={index} aria-hidden="true">
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    <Skeleton />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : sorted.length ? (
            sorted.slice(start, start + size).map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((column) =>
                  column.rowHeader ? (
                    <TableHead key={column.id} scope="row">
                      {column.cell(row)}
                    </TableHead>
                  ) : (
                    <TableCell key={column.id}>{column.cell(row)}</TableCell>
                  ),
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>{emptyContent}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <nav className="tz-data-pagination" aria-label={labels.pagination}>
        <span
          role={announcement === "polite" ? "status" : undefined}
          aria-live={announcement === "polite" ? "polite" : undefined}
          aria-atomic={announcement === "polite" ? true : undefined}
        >
          {labels.resultCount(
            data.length ? start + 1 : 0,
            Math.min(start + size, data.length),
            data.length,
          )}
        </span>
        <div>
          <Button
            variant="secondary"
            disabled={page === 1 || loading}
            onClick={() => setPaging({ page: page - 1, resetKey, size })}
          >
            {labels.previous}
          </Button>
          <Button
            variant="secondary"
            disabled={page === pages || loading}
            onClick={() => setPaging({ page: page + 1, resetKey, size })}
          >
            {labels.next}
          </Button>
        </div>
      </nav>
    </div>
  );
}
