import type { ReactNode } from "react";
import { formatElapsed } from "./format";
import { useChanged } from "./useChanged";
import { useSystem } from "./useSystem";

/** The six states every pattern shares (spec section 10). */
export type StatusPillState =
  "idle" | "running" | "needs-you" | "completed" | "failed" | "stopped";
export interface StatusPillProps {
  state: StatusPillState;
  /** Replaces the default word, for a form that agrees with the subject. */
  label?: ReactNode;
  /** Seconds, shown after the word; never announced. */
  elapsed?: number;
  className?: string;
}

const words: Record<"ar" | "en", Record<StatusPillState, string>> = {
  ar: {
    idle: "جاهز",
    running: "يعمل",
    "needs-you": "بانتظارك",
    completed: "اكتمل",
    failed: "تعثّر",
    stopped: "أُوقف",
  },
  en: {
    idle: "Ready",
    running: "Working",
    "needs-you": "Needs you",
    completed: "Done",
    failed: "Failed",
    stopped: "Stopped",
  },
};

/**
 * The single place a pattern names its state: a decorative dot and the word as
 * real text, in the state's color role. It pings once when the state changes
 * into needs-you, never on mount.
 */
export function StatusPill({
  state,
  label,
  elapsed,
  className = "",
}: StatusPillProps) {
  const { config } = useSystem();
  const changed = useChanged(state);
  const time = elapsed === undefined ? "" : formatElapsed(elapsed, config);
  return (
    <span
      className={`tz-status-pill ${className}`}
      data-state={state}
      data-changed={changed || undefined}
    >
      <span className="tz-status-pill-dot" aria-hidden="true" />
      <span>
        {label ?? words[config.direction === "rtl" ? "ar" : "en"][state]}
      </span>
      {time && (
        <>
          <span aria-hidden="true">·</span>
          <span
            className="tz-status-pill-elapsed"
            data-minutes={(elapsed ?? 0) >= 60 || undefined}
          >
            {time}
          </span>
        </>
      )}
    </span>
  );
}
