import type { ComponentPropsWithRef } from "react";
export type ThinkingIndicatorProps = Omit<
  ComponentPropsWithRef<"span">,
  "children"
> & {
  label: string;
  announcement?: "polite" | "off";
};
/** Stable application-supplied label; only the decorative stitches animate. */
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
      <svg
        className="tz-thinking-stitches"
        viewBox="0 0 24 16"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="2" y="7" width="4" height="2" rx="0.5" />
        <rect x="9" y="7" width="4" height="2" rx="0.5" />
        <rect x="16" y="7" width="4" height="2" rx="0.5" />
      </svg>
      <bdi>{label}</bdi>
    </span>
  );
}
