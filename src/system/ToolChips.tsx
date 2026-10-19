import type { ComponentPropsWithRef } from "react";
import type { ToolCallState } from "./ToolCall";
import { StatusIcon } from "./StatusIcon";
import { useToolLabels } from "./useToolLabels";
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
export type ToolChipsProps = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  label: string;
  items: readonly ToolChipItem[];
};
/** A compact summary. Informational chips never acquire button semantics. */
export function ToolChips({
  label,
  items,
  className = "",
  ...props
}: ToolChipsProps) {
  const labels = useToolLabels(),
    { config } = useSystem();
  const format = new Intl.NumberFormat(numberLocale(config));
  return (
    <ul
      {...props}
      role="list"
      aria-label={label}
      className={`tz-tool-chips ${className}`}
    >
      {items.map((item) => {
        const contents = (
          <>
            <StatusIcon state={item.state} tone="ai" />
            <bdi>{item.label}</bdi>
            <span className="tz-visually-hidden">{labels[item.state]}</span>
            {item.count != null &&
              Number.isFinite(item.count) &&
              item.count >= 0 && (
                <span className="tz-tool-count">
                  <Tick value={Math.floor(item.count)}>
                    {format.format(Math.floor(item.count))}
                  </Tick>
                </span>
              )}
          </>
        );
        return (
          <li key={item.id}>
            {item.onActivate ? (
              <button
                type="button"
                className="tz-tool-chip"
                onClick={item.onActivate}
                aria-controls={item.controls}
                aria-expanded={item.controls ? item.expanded : undefined}
              >
                {contents}
              </button>
            ) : (
              <span className="tz-tool-chip">{contents}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
