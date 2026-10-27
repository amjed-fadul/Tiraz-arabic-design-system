import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";
import { StatusIcon } from "./StatusIcon";
import { useChanged } from "./useChanged";
import { useSystem } from "./useSystem";
import { useToolLabels } from "./useToolLabels";

export type TaskState =
  "pending" | "running" | "needs-you" | "completed" | "failed";
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
  /** Separate capsules, a connected list, or plain rows on the host's paper. */
  appearance?: "capsules" | "list" | "plain";
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Replaces any of the shared state words. */
  stateLabels?: Partial<Record<TaskState, string>>;
  emptyState?: ReactNode;
  /** The default empty state's title. */
  labels?: { empty?: string };
};
export type TaskRowsRootProps = Omit<TaskRowsProps, "items" | "emptyState"> & {
  /** TaskRowsRow children, or one TaskRowsEmpty when there are no tasks. */
  children: ReactNode;
};
export interface TaskRowsRowProps {
  /** Unique, stable application ID. */
  id: string;
  title: string;
  /** Short, noninteractive summary or count. */
  summary?: string;
  state: TaskState;
  /** Application-owned detail content/actions, outside the disclosure button. */
  children: ReactNode;
}
export interface TaskRowsEmptyProps {
  /** Replaces the default empty state. */
  children?: ReactNode;
}

const TaskRowsContext = createContext<{
  expanded: readonly string[];
  toggle: (id: string) => void;
  words: Record<TaskState, string>;
  emptyTitle: string;
} | null>(null);
// A row's place in its list, counted over the root's children.
const PositionContext = createContext(0);
function useTaskRows(part: string) {
  const context = useContext(TaskRowsContext);
  if (!context) throw new Error(`${part} requires TaskRowsRoot.`);
  return context;
}

/** One expandable task. Its children are the detail content. */
export function TaskRowsRow({
  id,
  title,
  summary,
  state,
  children,
}: TaskRowsRowProps) {
  const { expanded: open, toggle, words } = useTaskRows("TaskRowsRow");
  const number = useContext(PositionContext);
  const expanded = open.includes(id);
  const uid = useId();
  const titleId = `${uid}-title`,
    panelId = `${uid}-panel`;
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const previous = useRef(expanded);
  const stateChanged = useChanged(state);
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
    <li className="tz-agent-task" data-state={state} data-expanded={expanded}>
      <button
        ref={trigger}
        type="button"
        className="tz-agent-task-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => toggle(id)}
      >
        <StatusIcon
          className="tz-agent-task-indicator"
          state={state}
          number={number}
          tone="ai"
        />
        <bdi id={titleId} className="tz-agent-task-title">
          {title}
        </bdi>
        {summary != null && (
          <bdi className="tz-agent-task-summary">{summary}</bdi>
        )}
        <Badge
          key={state}
          className="tz-agent-task-state"
          data-changed={stateChanged || undefined}
          tone={
            state === "completed"
              ? "success"
              : state === "failed"
                ? "error"
                : state === "running"
                  ? "ai"
                  : state === "needs-you"
                    ? "warning"
                    : "neutral"
          }
        >
          {words[state]}
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
          <div className="tz-agent-task-content">{children}</div>
        </div>
      </div>
    </li>
  );
}

/** The empty state: the root's default title, or your children. */
export function TaskRowsEmpty({ children }: TaskRowsEmptyProps) {
  const { emptyTitle } = useTaskRows("TaskRowsEmpty");
  return <li>{children ?? <EmptyState title={emptyTitle} />}</li>;
}

/** Execution state is supplied by the application; only disclosure state can be internal. */
export function TaskRowsRoot({
  label,
  appearance = "capsules",
  expandedIds,
  defaultExpandedIds = [],
  onExpandedChange,
  stateLabels,
  labels,
  className = "",
  children,
  ...props
}: TaskRowsRootProps) {
  const { config } = useSystem();
  const [localIds, setLocalIds] =
    useState<readonly string[]>(defaultExpandedIds);
  const expanded = expandedIds ?? localIds;
  const ar = config.direction === "rtl";
  // The step words every pattern shares (§18), any of them replaceable.
  const shared = useToolLabels();
  const words: Record<TaskState, string> = { ...shared, ...stateLabels };
  const emptyTitle =
    labels?.empty ?? (ar ? "لا توجد مهام بعد" : "No agent tasks");
  const toggle = (id: string) => {
    const next = expanded.includes(id)
      ? expanded.filter((open) => open !== id)
      : [...expanded, id];
    if (expandedIds === undefined) setLocalIds(next);
    onExpandedChange?.(next);
  };
  return (
    <TaskRowsContext.Provider value={{ expanded, toggle, words, emptyTitle }}>
      <ul
        {...props}
        role="list"
        aria-label={label}
        data-appearance={appearance}
        className={`tz-task-rows ${className}`}
      >
        {Children.toArray(children).map((child, index) => (
          <PositionContext.Provider
            key={isValidElement(child) ? child.key : index}
            value={index + 1}
          >
            {child}
          </PositionContext.Provider>
        ))}
      </ul>
    </TaskRowsContext.Provider>
  );
}

/** Original convenience API, rendered through the compound parts. */
export function TaskRows({ items, emptyState, ...root }: TaskRowsProps) {
  return (
    <TaskRowsRoot {...root}>
      {items.length === 0 ? (
        <TaskRowsEmpty>{emptyState}</TaskRowsEmpty>
      ) : (
        items.map(({ content, ...item }) => (
          <TaskRowsRow key={item.id} {...item}>
            {content}
          </TaskRowsRow>
        ))
      )}
    </TaskRowsRoot>
  );
}
