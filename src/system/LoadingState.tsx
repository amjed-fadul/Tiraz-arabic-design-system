import type { ComponentPropsWithRef } from "react";
import { Skeleton } from "./Skeleton";

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
          <svg
            className="tz-loading-weave"
            viewBox="0 0 24 16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              className="tz-loading-warps"
              d="M3.5 4h17M3.5 8h17M3.5 12h17"
            />
            <g className="tz-loading-weft">
              {/* The gap lets the middle warp pass over the moving thread. */}
              <path d="M0 1v5.5M0 9.5V15" />
            </g>
          </svg>
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
