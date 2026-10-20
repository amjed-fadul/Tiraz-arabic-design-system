import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";
import { StatusIcon } from "./StatusIcon";
import { useChanged } from "./useChanged";
import { useSystem } from "./useSystem";

export type TaskState = "pending" | "running" | "completed" | "failed";
export interface TaskRowItem {
  /** Unique, stable application ID. */
  id: string;
  title: string;
  /** Short, noninteractive summary or count. */
  summary?: string;
  state: TaskState;
  /** Application-owned detail content/actions, outside the disclosure button. */
  content: ReactNode;
}
export type TaskRowsProps = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  items: readonly TaskRowItem[];
  label: string;
  appearance?: "capsules" | "list";
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  stateLabels?: Record<TaskState, string>;
  emptyState?: ReactNode;
};
function TaskRow({
  item,
  number,
  expanded,
  onToggle,
  stateLabel,
}: {
  item: TaskRowItem;
  number: number;
  expanded: boolean;
  onToggle: () => void;
  stateLabel: string;
}) {
  const uid = useId();
  const titleId = `${uid}-title`,
    panelId = `${uid}-panel`;
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const previous = useRef(expanded);
  const stateChanged = useChanged(item.state);
  useLayoutEffect(() => {
    const focused = lastFocus.current,
      doc = panel.current?.ownerDocument;
    if (
      previous.current &&
      !expanded &&
      focused &&
      panel.current?.contains(focused) &&
      (doc?.activeElement === focused || doc?.activeElement === doc?.body)
    )
      trigger.current?.focus();
    if (!expanded) lastFocus.current = null;
    previous.current = expanded;
  }, [expanded]);
  return (
    <li
      className="tz-agent-task"
      data-state={item.state}
      data-expanded={expanded}
    >
      <button
        ref={trigger}
        type="button"
        className="tz-agent-task-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <StatusIcon
          className="tz-agent-task-indicator"
          state={item.state}
          number={number}
          tone="ai"
        />
        <bdi id={titleId} className="tz-agent-task-title">
          {item.title}
        </bdi>
        {item.summary != null && (
          <bdi className="tz-agent-task-summary">{item.summary}</bdi>
        )}
        <Badge
          key={item.state}
          className="tz-agent-task-state"
          data-changed={stateChanged || undefined}
          tone={
            item.state === "completed"
              ? "success"
              : item.state === "failed"
                ? "error"
                : item.state === "running"
                  ? "ai"
                  : "neutral"
          }
        >
          {stateLabel}
        </Badge>
        <ChevronDown className="tz-agent-task-chevron" aria-hidden="true" />
      </button>
      <div
        ref={panel}
        id={panelId}
        role="region"
        aria-labelledby={titleId}
        hidden={!expanded}
        aria-hidden={!expanded || undefined}
        inert={!expanded}
        className="tz-agent-task-panel"
        onFocusCapture={(event) => {
          lastFocus.current = event.target as HTMLElement;
        }}
        onBlurCapture={(event) => {
          // A deliberate departure from a visible panel must not be reclaimed.
          // Keep the last target only when hiding the panel caused its blur.
          if (
            !event.currentTarget.hidden &&
            !event.currentTarget.contains(event.relatedTarget)
          )
            lastFocus.current = null;
        }}
      >
        <div className="tz-agent-task-panel-clip">
          <div className="tz-agent-task-content">{item.content}</div>
        </div>
      </div>
    </li>
  );
}
/** Execution state is supplied by the application; only disclosure state can be internal. */
export function TaskRows({
  items,
  label,
  appearance = "capsules",
  expandedIds,
  defaultExpandedIds = [],
  onExpandedChange,
  stateLabels,
  emptyState,
  className = "",
  ...props
}: TaskRowsProps) {
  const { config } = useSystem();
  const [localIds, setLocalIds] =
    useState<readonly string[]>(defaultExpandedIds);
  const expanded = expandedIds ?? localIds;
  const ar = config.direction === "rtl";
  const labels = stateLabels ?? {
    pending: ar ? "قيد الانتظار" : "Pending",
    running: ar ? "جارٍ التنفيذ" : "Running",
    completed: ar ? "مكتملة" : "Completed",
    failed: ar ? "فشلت" : "Failed",
  };
  return (
    <ul
      {...props}
      role="list"
      aria-label={label}
      data-appearance={appearance}
      className={`tz-task-rows ${className}`}
    >
      {items.length === 0 ? (
        <li>
          {emptyState ?? (
            <EmptyState title={ar ? "لا توجد مهام بعد" : "No agent tasks"} />
          )}
        </li>
      ) : (
        items.map((item, index) => (
          <TaskRow
            key={item.id}
            item={item}
            number={index + 1}
            expanded={expanded.includes(item.id)}
            stateLabel={labels[item.state]}
            onToggle={() => {
              const next = expanded.includes(item.id)
                ? expanded.filter((id) => id !== item.id)
                : [...expanded, item.id];
              if (expandedIds === undefined) setLocalIds(next);
              onExpandedChange?.(next);
            }}
          />
        ))
      )}
    </ul>
  );
}
