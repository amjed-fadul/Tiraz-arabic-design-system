import { Check, CircleAlert } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { useSystem } from "./useSystem";

export type StepStatus = "upcoming" | "current" | "completed" | "error";
export interface StepItem {
  id: string;
  /** Text or inline content; keep labels free of interactive descendants. */
  label: ReactNode;
  description?: ReactNode;
  status: StepStatus;
}
export type StepsProps = Omit<ComponentPropsWithRef<"ol">, "children"> & {
  items: readonly StepItem[];
  label: string;
  orientation?: "horizontal" | "vertical";
  /** Overrides status=current, including for an error on the current step. */
  currentId?: string;
  /** Opts into buttons. The application owns eligibility and state changes. */
  onStepActivate?: (id: string) => void;
  locale?: "ar" | "en";
  statusLabels?: Record<StepStatus, string>;
};
export function Steps({
  items,
  label,
  orientation = "horizontal",
  currentId,
  onStepActivate,
  locale,
  statusLabels,
  className = "",
  ...props
}: StepsProps) {
  const { config } = useSystem();
  const ar = (locale ?? (config.direction === "rtl" ? "ar" : "en")) === "ar";
  const labels =
    statusLabels ??
    (ar
      ? {
          upcoming: "قادمة",
          current: "الحالية",
          completed: "مكتملة",
          error: "خطأ",
        }
      : {
          upcoming: "Upcoming",
          current: "Current",
          completed: "Completed",
          error: "Error",
        });
  const activeId =
    currentId ?? items.find((item) => item.status === "current")?.id;
  const number = new Intl.NumberFormat(ar ? "ar-u-nu-arab" : "en");
  return (
    <ol
      {...props}
      aria-label={label}
      role="list"
      className={`tz-steps ${className}`}
      data-orientation={orientation}
    >
      {items.map((item, index) => {
        const current = item.id === activeId;
        const content = (
          <>
            <span className="tz-step-indicator" aria-hidden="true">
              {item.status === "completed" ? (
                <Check size={14} />
              ) : item.status === "error" ? (
                <CircleAlert size={16} />
              ) : (
                number.format(index + 1)
              )}
            </span>
            <span className="tz-step-copy">
              <span className="tz-step-label">{item.label}</span>
              {item.description != null && (
                <span className="tz-step-description">{item.description}</span>
              )}
              <span className="tz-visually-hidden">{labels[item.status]}</span>
            </span>
          </>
        );
        return (
          <li
            key={item.id}
            className="tz-step"
            data-status={item.status}
            data-current={current || undefined}
            aria-current={!onStepActivate && current ? "step" : undefined}
          >
            {onStepActivate ? (
              <button
                type="button"
                className="tz-step-body tz-step-button"
                aria-current={current ? "step" : undefined}
                onClick={() => onStepActivate(item.id)}
              >
                {content}
              </button>
            ) : (
              <div className="tz-step-body">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
