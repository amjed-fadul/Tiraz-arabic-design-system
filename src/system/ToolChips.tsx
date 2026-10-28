import { createContext, useContext } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import type { ToolCallState } from "./ToolCall";
import { StatusIcon } from "./StatusIcon";
import { useToolLabels } from "./useToolLabels";
import type { ToolLabels } from "./useToolLabels";
import { useSystem } from "./useSystem";
import { Tick } from "./Tick";
import { numberLocale } from "./config";
export interface ToolChipItem {
  id: string;
  label: string;
  state: ToolCallState;
  count?: number;
  /** Present only when the host connects a real action. */
  onActivate?: () => void;
  /** Optional ID and state of connected host details. */
  controls?: string;
  expanded?: boolean;
}
/** One chip as a part: the item's fields, each a plain value but `onActivate`. */
export type ToolChipProps = ToolChipItem;
export type ToolChipsProps = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  label: string;
  items?: readonly ToolChipItem[];
  /** ToolChip parts, as an alternative to `items`. Drawn after any items. */
  children?: ReactNode;
  /** Replaces any state word. */
  labels?: Partial<ToolLabels>;
};

const ToolChipsContext = createContext<{
  labels: ToolLabels;
  format: Intl.NumberFormat;
} | null>(null);

/** One chip of a ToolChips list. It becomes a button only with `onActivate`. */
export function ToolChip({
  label,
  state,
  count,
  onActivate,
  controls,
  expanded,
}: ToolChipProps) {
  const context = useContext(ToolChipsContext);
  if (!context) throw new Error("ToolChip requires ToolChips.");
  const { labels, format } = context;
  const contents = (
    <>
      <StatusIcon state={state} tone="ai" />
      <bdi>{label}</bdi>
      <span className="tz-visually-hidden">{labels[state]}</span>
      {count != null && Number.isFinite(count) && count >= 0 && (
        <span className="tz-tool-count">
          <Tick value={Math.floor(count)}>
            {format.format(Math.floor(count))}
          </Tick>
        </span>
      )}
    </>
  );
  return (
    <li>
      {onActivate ? (
        <button
          type="button"
          className="tz-tool-chip"
          onClick={onActivate}
          aria-controls={controls}
          aria-expanded={controls ? expanded : undefined}
        >
          {contents}
        </button>
      ) : (
        <span className="tz-tool-chip">{contents}</span>
      )}
    </li>
  );
}

/** A compact summary. Informational chips never acquire button semantics. */
export function ToolChips({
  label,
  items = [],
  children,
  labels: overrides,
  className = "",
  ...props
}: ToolChipsProps) {
  const labels = useToolLabels(overrides),
    { config } = useSystem();
  const format = new Intl.NumberFormat(numberLocale(config));
  return (
    <ToolChipsContext.Provider value={{ labels, format }}>
      <ul
        {...props}
        role="list"
        aria-label={label}
        className={`tz-tool-chips ${className}`}
      >
        {items.map((item) => (
          <ToolChip key={item.id} {...item} />
        ))}
        {children}
      </ul>
    </ToolChipsContext.Provider>
  );
}
