import type { ComponentPropsWithRef, ReactNode } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { useSystem } from "./useSystem";
import { Tick } from "./Tick";

export interface NotificationItem {
  id: string;
  title: string;
  description?: ReactNode;
  timestamp: string;
  /** Valid machine-readable HTML date/time, supplied by the application. */
  dateTime?: string;
  read: boolean;
  avatar?: ReactNode;
  /** Decorative icon. Essential meaning belongs in text. */
  icon?: ReactNode;
  action?: ReactNode;
}
export type NotificationListProps = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  items: readonly NotificationItem[];
  label: string;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  labels?: {
    unread: string;
    read: string;
    markRead: string;
    markAllRead: string;
  };
  emptyState?: ReactNode;
};
/** The count always reflects supplied items. Opening an action never changes read state. */
export function NotificationList({
  items,
  label,
  onMarkRead,
  onMarkAllRead,
  labels,
  emptyState,
  className = "",
  ...props
}: NotificationListProps) {
  const { config } = useSystem();
  const ar = config.direction === "rtl";
  const text = labels ?? {
    unread: ar ? "غير مقروءة" : "unread",
    read: ar ? "مقروءة" : "Read",
    markRead: ar ? "تعليم كمقروءة" : "Mark as read",
    markAllRead: ar ? "تعليم الكل كمقروء" : "Mark all as read",
  };
  const unread = items.filter((item) => !item.read).length;
  return (
    <div {...props} className={`tz-notification-list ${className}`}>
      <div className="tz-notification-header">
        <span className="tz-row-title">{label}</span>
        <Badge>
          <Tick value={unread}>
            {`${new Intl.NumberFormat(ar ? "ar-u-nu-arab" : "en").format(unread)} ${text.unread}`}
          </Tick>
        </Badge>
        {onMarkAllRead && (
          <Button
            size="sm"
            variant="ghost"
            disabled={unread === 0}
            onClick={() => {
              if (unread > 0) onMarkAllRead();
            }}
          >
            {text.markAllRead}
          </Button>
        )}
      </div>
      <ul role="list" aria-label={label} className="tz-notification-items">
        {items.length === 0 ? (
          <li>
            {emptyState ?? (
              <EmptyState title={ar ? "لا توجد إشعارات" : "No notifications"} />
            )}
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="tz-notification-row"
              data-unread={!item.read}
            >
              {(item.avatar != null || item.icon != null) && (
                <div className="tz-notification-leading">
                  {item.avatar ?? <span aria-hidden="true">{item.icon}</span>}
                </div>
              )}
              <div className="tz-notification-copy">
                <div className="tz-notification-heading">
                  <bdi className="tz-row-title">{item.title}</bdi>
                  {item.dateTime ? (
                    <time dateTime={item.dateTime}>{item.timestamp}</time>
                  ) : (
                    <span className="tz-notification-time">
                      {item.timestamp}
                    </span>
                  )}
                </div>
                {item.description != null && (
                  <div className="tz-notification-description">
                    {item.description}
                  </div>
                )}
                <div className="tz-row-meta">
                  <span className="tz-notification-state">
                    {!item.read && (
                      <span className="tz-unread-dot" aria-hidden="true" />
                    )}
                    {item.read ? text.read : text.unread}
                  </span>
                </div>
                <div className="tz-row-actions">
                  {item.action}
                  {onMarkRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-disabled={item.read || undefined}
                      aria-label={`${item.read ? text.read : text.markRead}: ${item.title}`}
                      onClick={() => {
                        if (!item.read) onMarkRead(item.id);
                      }}
                    >
                      {item.read ? text.read : text.markRead}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
