import type { ComponentPropsWithRef, CSSProperties } from "react";
import { Skeleton } from "./Skeleton";
import { useSystem } from "./useSystem";
import { formatElapsed } from "./format";
export type LoadingStateProps = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  label: string;
  description?: string;
  variant?: "drive" | "dots" | "orbit";
  /** Host-supplied elapsed milliseconds. Rendering never starts a clock. */
  elapsedMs?: number;
  /** Compatibility: spinner selects the pixel grid; skeleton keeps its placeholder. */
  indicator?: "spinner" | "skeleton";
  announcement?: "polite" | "off";
};
const driveDelays = [90, 180, 270, 0, 90, 180, 90, 180, 270];
const orbitDelays = [0, 110, 220, 770, 0, 330, 660, 550, 440];
/** Compact loading feedback; execution and elapsed time belong to the host. */
export function LoadingState({
  label,
  description,
  variant = "drive",
  elapsedMs,
  indicator = "spinner",
  announcement = "polite",
  className = "",
  ...props
}: LoadingStateProps) {
  const { config } = useSystem();
  // One fraction digit under a minute (٦٫٢ث), then ١د ١٢ث, as the pill shows.
  const elapsed =
    elapsedMs !== undefined && Number.isFinite(elapsedMs)
      ? formatElapsed(elapsedMs / 1000, config, { fractionDigits: 1 })
      : undefined;
  return (
    <div {...props} className={`tz-loading-state ${className}`}>
      <span
        className="tz-visually-hidden"
        role={announcement === "polite" ? "status" : undefined}
        aria-live={announcement === "polite" ? "polite" : "off"}
        aria-atomic="true"
      >
        {label}
        {description ? ` ${description}` : ""}
      </span>
      <span className="tz-loading-state-visual" aria-hidden="true">
        {indicator === "skeleton" ? (
          <Skeleton shape="circle" style={{ inlineSize: 15, blockSize: 15 }} />
        ) : (
          <span className="tz-pixel-grid" data-variant={variant}>
            {(variant === "orbit" ? orbitDelays : driveDelays).map(
              (delay, index) => (
                <span
                  key={index}
                  style={{ "--pixel-delay": `${delay}ms` } as CSSProperties}
                />
              ),
            )}
          </span>
        )}
      </span>
      <div className="tz-loading-state-copy" aria-hidden="true">
        <div className="tz-loading-state-row">
          <bdi className="tz-loading-state-label tz-ai-shimmer">{label}</bdi>
          {elapsed !== undefined && (
            <bdi className="tz-loading-elapsed" aria-hidden="true">
              {elapsed}
            </bdi>
          )}
        </div>
        {description && (
          <bdi className="tz-loading-state-description">{description}</bdi>
        )}
      </div>
    </div>
  );
}
