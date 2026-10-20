import type { ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  Info,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BadgeTone } from "./Badge";
export interface AlertProps {
  title: string;
  description?: string;
  tone?: BadgeTone;
  action?: ReactNode;
  announcement?: "off" | "polite" | "assertive";
}
// One glyph per tone beside the title. The words carry the meaning; the glyph
// and the tone color only echo it.
const icons: Record<BadgeTone, LucideIcon> = {
  neutral: Info,
  info: Info,
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  ai: Sparkles,
};
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
  const Icon = icons[tone] ?? Info;
  return (
    <div
      className="tz-alert"
      data-tone={tone}
      role={role}
      aria-atomic={role ? true : undefined}
    >
      <div className="tz-alert-copy">
        <Icon className="tz-alert-icon" aria-hidden="true" size={20} />
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="tz-alert-action">{action}</div>}
    </div>
  );
}
