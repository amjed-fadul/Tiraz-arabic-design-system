import type { ComponentPropsWithRef } from "react";
import { Button } from "./Button";
import { normalizePagination, paginationRange } from "./pagination-range";
import { useSystem } from "./useSystem";

export interface PaginationLabels {
  navigation: string;
  previous: string;
  next: string;
  page: (page: number) => string;
}
export type PaginationProps = Omit<
  ComponentPropsWithRef<"nav">,
  "children" | "onChange"
> & {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: PaginationLabels;
  locale?: "ar" | "en";
  disabled?: boolean;
};
/** Controlled navigation only; the application owns data, filtering and page size. */
export function Pagination({
  page: suppliedPage,
  totalPages: suppliedTotal,
  onPageChange,
  labels,
  locale,
  disabled = false,
  className = "",
  ...props
}: PaginationProps) {
  const { config } = useSystem();
  const { page, totalPages } = normalizePagination(suppliedPage, suppliedTotal);
  const language = locale ?? (config.direction === "rtl" ? "ar" : "en");
  const number = new Intl.NumberFormat(
    language === "ar" ? "ar-u-nu-arab" : "en",
    { useGrouping: false },
  );
  return (
    <nav
      {...props}
      aria-label={labels.navigation}
      className={`tz-pagination ${className}`}
    >
      <ol>
        <li>
          <Button
            variant="secondary"
            disabled={disabled || page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            {labels.previous}
          </Button>
        </li>
        {paginationRange(page, totalPages).map((slot) => (
          <li key={slot}>
            {typeof slot === "number" ? (
              <Button
                variant="ghost"
                disabled={disabled}
                aria-label={labels.page(slot)}
                aria-current={slot === page ? "page" : undefined}
                onClick={() => {
                  if (slot !== page) onPageChange(slot);
                }}
              >
                {number.format(slot)}
              </Button>
            ) : (
              <span className="tz-pagination-gap" aria-hidden="true">
                …
              </span>
            )}
          </li>
        ))}
        <li>
          <Button
            variant="secondary"
            disabled={disabled || page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {labels.next}
          </Button>
        </li>
      </ol>
    </nav>
  );
}
