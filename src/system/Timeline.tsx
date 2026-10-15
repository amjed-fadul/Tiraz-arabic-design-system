import type { ComponentPropsWithRef, ReactNode } from "react";
import { useSystem } from "./useSystem";

export interface TimelineItem {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Application-formatted date/time, in the application's locale/time zone. */
  timestamp: string;
  /** A valid machine-readable HTML date/time, when available. */
  dateTime?: string;
  /** Decorative icon; include any essential meaning in the title. */
  icon?: ReactNode;
  /** Application content/actions, composed with existing components. */
  content?: ReactNode;
}
export type TimelineProps = Omit<ComponentPropsWithRef<"ol">, "children"> & {
  items: readonly TimelineItem[];
  label: string;
  emptyState?: ReactNode;
};
/** Supplied order is preserved exactly, independently of direction or dates. */
export function Timeline({
  items,
  label,
  emptyState,
  className = "",
  ...props
}: TimelineProps) {
  const { config } = useSystem();
  return (
    <ol
      {...props}
      role="list"
      aria-label={label}
      className={`tz-timeline ${className}`}
    >
      {items.length === 0 ? (
        <li className="tz-timeline-empty">
          {emptyState ??
            (config.direction === "rtl"
              ? "لا توجد أحداث بعد."
              : "No events yet.")}
        </li>
      ) : (
        items.map((item) => (
          <li key={item.id} className="tz-timeline-item">
            <span className="tz-timeline-indicator" aria-hidden="true">
              {item.icon ?? <span className="tz-timeline-dot" />}
            </span>
            <div className="tz-timeline-copy">
              <div className="tz-timeline-heading">
                <span className="tz-timeline-title">{item.title}</span>
                {item.dateTime ? (
                  <time dateTime={item.dateTime}>{item.timestamp}</time>
                ) : (
                  <span className="tz-timeline-time">{item.timestamp}</span>
                )}
              </div>
              {item.description != null && (
                <div className="tz-timeline-description">
                  {item.description}
                </div>
              )}
              {item.content != null && (
                <div className="tz-timeline-content">{item.content}</div>
              )}
            </div>
          </li>
        ))
      )}
    </ol>
  );
}
