import { numberLocale } from "./config";
import type { Numerals } from "./config";
/** Missing/nonfinite values remain gaps. Numeric strings are not silently coerced. */
export function chartValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function chartNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
  numerals?: Numerals,
): string {
  return new Intl.NumberFormat(
    numberLocale({ numerals }, locale),
    options,
  ).format(value);
}
export function chartCategory(
  value: string,
  locale: string,
  format: "text" | "date",
  numerals?: Numerals,
): string {
  if (format === "text") return value;
  // Explicit ISO input, UTC output: host timezone never shifts a day backwards.
  if (!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return value;
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(numberLocale({ numerals }, locale), {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(date);
}
