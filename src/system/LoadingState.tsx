import type { ComponentPropsWithRef } from "react";
import { Skeleton } from "./Skeleton";
import { Spinner } from "./Spinner";

export type LoadingStateProps = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  label: string;
  description?: string;
  indicator?: "spinner" | "skeleton";
  /** Turn off when a surrounding region already announces this status. */
  announcement?: "polite" | "off";
};
/** Compact feedback. The host owns loading state and the busy content region. */
export function LoadingState({
  label,
  description,
  indicator = "spinner",
  announcement = "polite",
  className = "",
  ...props
}: LoadingStateProps) {
  return (
    <div {...props} className={`tz-loading-state ${className}`}>
      <span className="tz-loading-state-visual" aria-hidden="true">
        {indicator === "spinner" ? (
          <Spinner decorative />
        ) : (
          <Skeleton shape="circle" style={{ inlineSize: 16, blockSize: 16 }} />
        )}
      </span>
      <div
        role={announcement === "polite" ? "status" : undefined}
        aria-live={announcement === "polite" ? "polite" : "off"}
        aria-atomic="true"
        className="tz-loading-state-copy"
      >
        <bdi className="tz-loading-state-label">{label}</bdi>
        {description && (
          <bdi className="tz-loading-state-description"> {description}</bdi>
        )}
      </div>
    </div>
  );
}
