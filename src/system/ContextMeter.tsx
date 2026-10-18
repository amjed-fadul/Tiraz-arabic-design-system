import * as Popover from "@radix-ui/react-popover";
import { useId } from "react";
import { useSystem } from "./useSystem";
import { Tick } from "./Tick";
import { numberLocale } from "./config";

export interface ContextMeterPart {
  id: string;
  label: string;
  value?: number | null;
}
export interface ContextMeterProps {
  used?: number | null;
  capacity?: number | null;
  estimated?: boolean;
  details?: readonly ContextMeterPart[];
  /** Supplied metadata, e.g. a model or cost. Never looked up by this component. */
  metadata?: string;
  label?: string;
  unit?: string;
  locale?: string;
  className?: string;
}
const valid = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= 0;
export function ContextMeter({
  used,
  capacity,
  estimated = false,
  details,
  metadata,
  label,
  unit,
  locale,
  className = "",
}: ContextMeterProps) {
  const { config, container } = useSystem(),
    ar = config.direction === "rtl",
    title = useId();
  // Digits follow the system numerals unless the host pins a locale.
  const numbers = locale ?? numberLocale(config);
  const format = new Intl.NumberFormat(numbers, {
    maximumFractionDigits: 2,
  });
  const percent = new Intl.NumberFormat(numbers, {
    style: "percent",
    maximumFractionDigits: 2,
  });
  const compact = new Intl.NumberFormat(numbers, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const u = valid(used),
    c = valid(capacity);
  const ratio = u && c && capacity > 0 ? used / capacity : null;
  const percentage =
    ratio !== null && Number.isFinite(ratio * 100)
      ? percent.format(ratio)
      : null;
  const name = label ?? (ar ? "السياق" : "Context"),
    units = unit ?? (ar ? "رمز" : "tokens");
  const estimate = estimated ? (ar ? "تقديري" : "Estimated") : "";
  const usage = u
    ? format.format(used)
    : ar
      ? "الاستخدام غير متاح"
      : "Usage unavailable";
  const limit = c
    ? format.format(capacity)
    : ar
      ? "السعة غير متاحة"
      : "Capacity unavailable";
  const summary =
    u && c
      ? ar
        ? `${usage} من ${limit} ${units}`
        : `${usage} of ${limit} ${units}`
      : `${usage} · ${limit}${c ? ` ${units}` : ""}`;
  const status =
    u && c && used > capacity
      ? ar
        ? "تجاوز السعة"
        : "Over capacity"
      : c && capacity === 0
        ? ar
          ? "السعة صفر"
          : "Capacity is zero"
        : ratio !== null && ratio >= 0.95
          ? ar
            ? "شبه ممتلئ"
            : "Near capacity"
          : ratio !== null && ratio >= 0.8
            ? ar
              ? "يقترب من الامتلاء"
              : "Filling up"
            : "";
  const tone =
    u && c && used > capacity
      ? "over"
      : ratio !== null && ratio >= 0.95
        ? "near"
        : ratio !== null && ratio >= 0.8
          ? "high"
          : "normal";
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        className={`tz-context-trigger ${className}`}
        data-tone={tone}
        aria-label={[name, estimate, summary, percentage, status]
          .filter(Boolean)
          .join(": ")}
      >
        <svg className="tz-context-ring" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" />
          <circle
            cx="10"
            cy="10"
            r="7.5"
            pathLength="100"
            style={{
              strokeDasharray: `${ratio === null ? 0 : Math.min(100, Math.max(0, ratio * 100))} 100`,
            }}
          />
        </svg>
        <span>
          {estimated && "≈ "}
          <bdi>
            <Tick value={u ? used : "—"}>{u ? compact.format(used) : "—"}</Tick>{" "}
            / {c ? compact.format(capacity) : "—"}
          </bdi>
        </span>
        {status && <span className="tz-context-status">{status}</span>}
      </Popover.Trigger>
      <Popover.Portal container={container}>
        <Popover.Content
          className="tz-context-details"
          dir={config.direction}
          aria-labelledby={title}
          sideOffset={6}
          collisionPadding={8}
        >
          <strong id={title}>
            {name}
            {estimate ? ` · ${estimate}` : ""}
          </strong>
          <p>{summary}</p>
          {percentage && (
            <p>
              {percentage} {ar ? "مستخدم" : "used"}
            </p>
          )}
          {status && (
            <p className="tz-context-status" data-tone={tone}>
              {status}
            </p>
          )}
          {!!details?.length && (
            <dl>
              {details.map((part) => (
                <div key={part.id}>
                  <dt dir="auto">{part.label}</dt>
                  <dd>
                    <bdi>
                      {valid(part.value)
                        ? format.format(part.value)
                        : ar
                          ? "غير متاح"
                          : "Unavailable"}
                    </bdi>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {metadata && <small dir="auto">{metadata}</small>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
