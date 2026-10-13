import type { ComponentPropsWithRef } from "react";

export type BadgeTone = "neutral" | "success" | "error" | "info";
export type BadgeProps = ComponentPropsWithRef<"span"> & {
  tone?: BadgeTone;
};
/** Static status text. Meaning must be supplied in children, not color alone. */
export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span {...props} data-tone={tone} className={`tz-badge ${className}`} />
  );
}
