import { useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "./Badge";
import type { BadgeTone } from "./Badge";
import { Button } from "./Button";
import { CardTitle } from "./Card";
import { useSystem } from "./useSystem";
import { useChanged } from "./useChanged";
import { numberLocale } from "./config";
export interface InsightItem {
  id: string;
  title: string;
  /** Concise host-owned supporting content; may compose an existing chart. */
  details?: ReactNode;
  label?: string;
  tone?: BadgeTone;
  action?: { label: string; onClick: () => void };
}
export interface InsightCardsLabels {
  title?: string;
  previous?: string;
  next?: string;
  position?: (current: number, total: number) => string;
  empty?: string;
}
export interface InsightCardsProps {
  items: readonly InsightItem[];
  labels?: InsightCardsLabels;
  className?: string;
}
/** One finding at a time; stable IDs preserve the selected finding through updates. */
export function InsightCards({
  items,
  labels,
  className = "",
}: InsightCardsProps) {
  const { config } = useSystem(),
    ar = config.direction === "rtl",
    digits = new Intl.NumberFormat(numberLocale(config), {
      useGrouping: false,
    });
  const [selected, setSelected] = useState(items[0]?.id);
  const index = Math.max(
      0,
      items.findIndex((item) => item.id === selected),
    ),
    item = items[index];
  if (item && item.id !== selected) setSelected(item.id);
  // A finding fades in only when another one is shown, never on mount.
  const changed = useChanged(item?.id);
  if (!item)
    return (
      <p className={`tz-insights-empty ${className}`}>
        {labels?.empty ?? (ar ? "لا توجد نتائج" : "No findings supplied")}
      </p>
    );
  const Previous = ar ? ChevronRight : ChevronLeft,
    Next = ar ? ChevronLeft : ChevronRight;
  return (
    <div
      className={`tz-insights ${className}`}
      data-changed={changed || undefined}
      role="group"
      aria-label={labels?.title ?? (ar ? "النتائج" : "Insights")}
    >
      <header className="tz-insights-header">
        <span>{labels?.title ?? (ar ? "النتائج" : "Insights")}</span>
        <span className="tz-insights-position" role="status">
          {labels?.position?.(index + 1, items.length) ??
            `${digits.format(index + 1)} / ${digits.format(items.length)}`}
        </span>
        {items.length > 1 && (
          <div className="tz-insights-nav">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={
                labels?.previous ??
                (ar ? "النتيجة السابقة" : "Previous insight")
              }
              aria-disabled={index === 0}
              onClick={() => {
                if (index > 0) setSelected(items[index - 1].id);
              }}
            >
              <Previous size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={
                labels?.next ?? (ar ? "النتيجة التالية" : "Next insight")
              }
              aria-disabled={index === items.length - 1}
              onClick={() => {
                if (index < items.length - 1) setSelected(items[index + 1].id);
              }}
            >
              <Next size={16} aria-hidden="true" />
            </Button>
          </div>
        )}
      </header>
      <div key={item.id} className="tz-insight-page" data-insight-id={item.id}>
        <CardTitle dir="auto">{item.title}</CardTitle>
        {((item.details !== undefined && item.details !== null) ||
          item.label) && (
          <div className="tz-insight-detail">
            {item.label && <Badge tone={item.tone}>{item.label}</Badge>}
            {item.details}
          </div>
        )}
        {item.action && (
          <Button variant="secondary" size="sm" onClick={item.action.onClick}>
            <ArrowUpRight
              size={14}
              aria-hidden="true"
              className="tz-mirror-rtl"
            />
            {item.action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
