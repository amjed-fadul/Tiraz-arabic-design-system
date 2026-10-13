import type { ReactNode } from "react";
import type { BadgeTone } from "./Badge";
export interface AlertProps {
  title: string;
  description?: string;
  tone?: BadgeTone;
  action?: ReactNode;
  announcement?: "off" | "polite" | "assertive";
}
export function Alert({
  title,
  description,
  tone = "info",
  action,
  announcement = "off",
}: AlertProps) {
  const role =
    announcement === "assertive"
      ? "alert"
      : announcement === "polite"
        ? "status"
        : undefined;
  return (
    <div
      className="tz-alert"
      data-tone={tone}
      role={role}
      aria-atomic={role ? true : undefined}
    >
      <div className="tz-alert-copy">
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="tz-alert-action">{action}</div>}
    </div>
  );
}
