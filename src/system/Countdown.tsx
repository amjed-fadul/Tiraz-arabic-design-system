import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatElapsed } from "./format";
import { useSystem } from "./useSystem";

export interface CountdownProps {
  /** Whole seconds to count down from. */
  seconds: number;
  /** Stops the count; it resumes from the time left. */
  paused?: boolean;
  /** Called once, at zero. */
  onComplete: () => void;
  /** The sentence around the time left, «خلال ٥ث» / "in 5s" by default. */
  label?: (remaining: string) => string;
  /** Off when the owner pattern announces the countdown itself. */
  announcement?: "polite" | "off";
  className?: string;
}

/**
 * A ring and a label for an auto-start or undo window (spec section 11). A
 * one-second timer counts down while not paused. Its sentence is announced
 * once, never per tick.
 */
export function Countdown({
  seconds,
  paused = false,
  onComplete,
  label,
  announcement = "polite",
  className = "",
}: CountdownProps) {
  const { config } = useSystem();
  const total = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const [remaining, setRemaining] = useState(total);
  const done = remaining <= 0;
  const latest = useRef(onComplete),
    completed = useRef(false);
  useLayoutEffect(() => {
    latest.current = onComplete;
  });
  useEffect(() => {
    if (paused || done) return;
    const timer = setInterval(
      () => setRemaining((left) => Math.max(0, left - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [paused, done]);
  useEffect(() => {
    if (!done || completed.current) return;
    completed.current = true;
    latest.current();
  }, [done]);
  const say = (time: string) =>
    label
      ? label(time)
      : config.direction === "rtl"
        ? `خلال ${time}`
        : `in ${time}`;
  const sentence = say(formatElapsed(total, config));
  // The widest time the count shows: the start under a minute, otherwise its
  // minutes with 33 seconds, below an hour.
  const widest =
    total < 60 ? total : Math.floor(Math.min(total, 3599) / 60) * 60 + 33;
  // Screen readers skip a live region that mounts holding its text, so the
  // status mounts empty and takes the sentence once, after mount. React
  // renders no children into it, so the text is written here.
  const status = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = status.current;
    if (node && node.textContent !== sentence) node.textContent = sentence;
  }, [sentence, announcement]);
  return (
    <span className={`tz-countdown ${className}`}>
      {announcement === "polite" && (
        <span
          ref={status}
          className="tz-visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />
      )}
      <svg
        className="tz-countdown-ring"
        viewBox="0 0 20 20"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="10" cy="10" r="7.5" />
        <circle
          cx="10"
          cy="10"
          r="7.5"
          pathLength="100"
          style={{
            strokeDasharray: `${total > 0 ? (remaining / total) * 100 : 0} 100`,
          }}
        />
      </svg>
      {/* Arabic-Indic digits have no tabular widths, so a hidden copy of the
          widest sentence, set in the widest digit, holds the label's width
          while it counts. */}
      <span className="tz-countdown-label" aria-hidden="true">
        <span>{say(formatElapsed(widest, config).replace(/[٠-٩]/g, "٣"))}</span>
        <span>{say(formatElapsed(remaining, config))}</span>
      </span>
    </span>
  );
}
