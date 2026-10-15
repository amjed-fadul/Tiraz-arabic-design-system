import type { ComponentPropsWithRef } from "react";
export type ThinkingIndicatorProps = Omit<
  ComponentPropsWithRef<"span">,
  "children"
> & {
  label: string;
  announcement?: "polite" | "off";
};
/** Stable application-supplied label; only the decorative dots animate. */
export function ThinkingIndicator({
  label,
  announcement = "polite",
  className = "",
  ...props
}: ThinkingIndicatorProps) {
  return (
    <span
      {...props}
      className={`tz-thinking-indicator ${className}`}
      role={announcement === "polite" ? "status" : undefined}
      aria-live={announcement === "polite" ? "polite" : "off"}
      aria-atomic="true"
    >
      <span className="tz-thinking-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <bdi>{label}</bdi>
    </span>
  );
}
