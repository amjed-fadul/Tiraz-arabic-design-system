import { useSystem } from "./useSystem";
import { numberLocale } from "./config";
export interface ProgressProps {
  label: string;
  value?: number | null;
  showValue?: boolean;
  locale?: "ar" | "en";
}
export function Progress({
  label,
  value,
  showValue = false,
  locale,
}: ProgressProps) {
  const { config } = useSystem();
  const normalized =
    typeof value === "number" && Number.isFinite(value)
      ? Math.max(0, Math.min(100, value))
      : null;
  const formatted =
    normalized === null
      ? undefined
      : new Intl.NumberFormat(numberLocale(config, locale), {
          style: "percent",
          maximumFractionDigits: 0,
        }).format(normalized / 100);
  return (
    <div className="tz-progress">
      <div className="tz-progress-heading" aria-hidden="true">
        <span>{label}</span>
        {showValue && formatted && <bdi aria-hidden="true">{formatted}</bdi>}
      </div>
      <div
        className="tz-progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalized ?? undefined}
        aria-valuetext={formatted}
        data-indeterminate={normalized === null || undefined}
      >
        <span
          className="tz-progress-indicator"
          aria-hidden="true"
          style={{
            inlineSize: normalized === null ? undefined : `${normalized}%`,
          }}
        />
      </div>
    </div>
  );
}
