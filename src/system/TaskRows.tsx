import type { ComponentPropsWithRef, ReactNode } from "react";
import { Check, Circle } from "lucide-react";
import { Checkbox } from "./Checkbox";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";
import { useSystem } from "./useSystem";

export interface TaskRowItem {
  /** Unique, stable application ID. */
  id: string;
  label: string;
  description?: ReactNode;
  completed: boolean;
  disabled?: boolean;
  assignee?: ReactNode;
  meta?: ReactNode;
  /** Separate application controls, never placed inside the completion label. */
  actions?: ReactNode;
}
export type TaskRowsProps = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  items: readonly TaskRowItem[];
  label: string;
  onCompletedChange?: (id: string, completed: boolean) => void;
  labels?: { completed: string; incomplete: string };
  emptyState?: ReactNode;
};
/** Controlled task data in supplied order; never sorts or persists. */
export function TaskRows({
  items,
  label,
  onCompletedChange,
  labels,
  emptyState,
  className = "",
  ...props
}: TaskRowsProps) {
  const { config } = useSystem();
  const ar = config.direction === "rtl";
  const text = labels ?? {
    completed: ar ? "مكتملة" : "Completed",
    incomplete: ar ? "غير مكتملة" : "Incomplete",
  };
  return (
    <ul
      {...props}
      role="list"
      aria-label={label}
      className={`tz-task-rows ${className}`}
    >
      {items.length === 0 ? (
        <li>
          {emptyState ?? (
            <EmptyState title={ar ? "لا توجد مهام" : "No tasks"} />
          )}
        </li>
      ) : (
        items.map((item) => (
          <li
            key={item.id}
            className="tz-task-row"
            data-completed={item.completed}
            data-disabled={item.disabled || undefined}
          >
            <div className="tz-task-main">
              {onCompletedChange ? (
                <Checkbox
                  label={item.label}
                  checked={item.completed}
                  disabled={item.disabled}
                  onChange={(event) => {
                    if (!item.disabled)
                      onCompletedChange(item.id, event.currentTarget.checked);
                  }}
                />
              ) : (
                <div className="tz-task-static">
                  <span aria-hidden="true">
                    {item.completed ? <Check /> : <Circle />}
                  </span>
                  <bdi>{item.label}</bdi>
                </div>
              )}
              {item.description != null && (
                <div className="tz-task-description">{item.description}</div>
              )}
              <div className="tz-row-meta">
                <Badge>
                  {item.completed ? text.completed : text.incomplete}
                </Badge>
                {item.assignee}
                {item.meta}
              </div>
            </div>
            {item.actions != null && (
              <div className="tz-row-actions">{item.actions}</div>
            )}
          </li>
        ))
      )}
    </ul>
  );
}
