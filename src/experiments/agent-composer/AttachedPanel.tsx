import type { ReactNode } from "react";
import { Check, Pin, X } from "lucide-react";
import type { ComposerActivity } from "./activity-runtime";

export interface PanelBehavior {
  pinned?: boolean;
  onPin?: () => void;
  pinLabel?: string;
  onInspect?: () => void;
  onHoverChange?: (inside: boolean) => void;
  onFocusWithinChange?: (inside: boolean) => void;
  activity?: ComposerActivity;
  ar?: boolean;
}

export function AttachedPanel({
  id,
  title,
  label = title,
  icon,
  open,
  onClose,
  children,
  closeLabel,
  className = "",
  state = "idle",
  pinned,
  onPin,
  pinLabel,
  onInspect,
  onHoverChange,
  onFocusWithinChange,
  activity,
  ar = false,
}: {
  id: string;
  title: string;
  label?: string;
  icon: ReactNode;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  closeLabel: string;
  className?: string;
  state?: string;
} & PanelBehavior) {
  return (
    <section
      id={`ac-panel-${id}`}
      className={`ac-panel-shell ${className}`}
      data-open={open}
      data-state={state}
      data-category={
        id.startsWith("agent-") ? id : id === "folder-picker" ? "folders" : id
      }
      data-activity={activity?.status}
      data-pinned={pinned}
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
      onPointerEnter={() => open && onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      onFocusCapture={(event) => {
        onFocusWithinChange?.(true);
        if (!(event.target as HTMLElement).closest("[data-panel-control]"))
          onInspect?.();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          onFocusWithinChange?.(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="ac-panel-clip">
        <div className="ac-panel" data-socket={id}>
          <div className="ac-panel-heading">
            <span>
              {icon}
              {title}
            </span>
            {onPin && (
              <button
                data-panel-control
                className="ac-panel-pin"
                onClick={onPin}
                aria-pressed={pinned}
                aria-label={pinLabel}
                title={pinLabel}
              >
                <Pin size={11} />
              </button>
            )}
          </div>
          <button
            className="ac-panel-close"
            data-panel-control
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
          >
            <X size={10} />
          </button>
          {activity && !id.startsWith("agent-") && (
            <div className="ac-tool-activity" data-status={activity.status}>
              <span>
                {activity.status === "complete" ? (
                  <Check size={11} />
                ) : (
                  <i aria-hidden="true" />
                )}{" "}
                {activity.label[ar ? 1 : 0]}
              </span>
              <p dir="auto">{activity.detail[ar ? 1 : 0]}</p>
              <small>
                {activity.status === "running"
                  ? ar
                    ? "تستخدمه المهمة الآن"
                    : "In use by this task"
                  : activity.status === "complete"
                    ? ar
                      ? "نتيجة المعاينة"
                      : "Demo result"
                    : activity.status === "stopped"
                      ? ar
                        ? "توقف التنفيذ"
                        : "Stopped"
                      : ar
                        ? "يحتاج انتباهك"
                        : "Needs your attention"}
              </small>
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
