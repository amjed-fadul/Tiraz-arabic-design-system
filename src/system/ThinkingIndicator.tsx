import { useEffect, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { useReducedMotion } from "./useReducedMotion";
export type ThinkingIndicatorProps = Omit<
  ComponentPropsWithRef<"span">,
  "children"
> & {
  /** Stable accessible activity label; rotating display words never announce. */
  label: string;
  words?: readonly string[];
  textOnly?: boolean;
  announcement?: "polite" | "off";
};
const circle =
  "M12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8Z";
const loop =
  "M12 12C14 8.5 19 8.5 19 12C19 15.5 14 15.5 12 12C10 8.5 5 8.5 5 12C5 15.5 10 15.5 12 12Z";
const reverseCircle =
  "M12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16Z";
/** Cosmetic word rotation and SVG morphing; no execution-state transitions. */
export function ThinkingIndicator({
  label,
  words,
  textOnly = false,
  announcement = "polite",
  className = "",
  ...props
}: ThinkingIndicatorProps) {
  const reduced = useReducedMotion();
  const display = words?.filter((word) => word.trim().length > 0);
  const values = display?.length ? display : [label];
  const key = JSON.stringify([label, values]);
  const count = values.length;
  const [frame, setFrame] = useState({ key, index: 0 });
  const index = reduced || frame.key !== key ? 0 : frame.index % count;
  useEffect(() => {
    if (reduced || count < 2) return;
    const timer = setInterval(
      () =>
        setFrame((previous) => ({
          key,
          index: previous.key === key ? (previous.index + 1) % count : 1,
        })),
      3200,
    );
    return () => clearInterval(timer);
  }, [key, count, reduced]);
  return (
    <span {...props} className={`tz-thinking-indicator ${className}`}>
      <span
        className="tz-visually-hidden"
        role={announcement === "polite" ? "status" : undefined}
        aria-live={announcement === "polite" ? "polite" : "off"}
        aria-atomic="true"
      >
        {label}
      </span>
      {!textOnly && (
        <svg
          className="tz-thinking-glyph"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d={circle}>
            {!reduced && (
              <animate
                attributeName="d"
                dur="6s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;0.25;0.5;0.75;1"
                keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
                values={[circle, loop, reverseCircle, loop, circle].join(";")}
              />
            )}
          </path>
        </svg>
      )}
      <span className="tz-thinking-words" aria-hidden="true">
        {values.map((word, i) => (
          <bdi key={i} className="tz-thinking-word-measure">
            {word}
          </bdi>
        ))}
        <bdi
          key={`${key}-${reduced ? "still" : index}`}
          className="tz-thinking-word tz-ai-shimmer"
        >
          {values[index]}
        </bdi>
      </span>
    </span>
  );
}
