import { useEffect, useState } from "react";
import type { ComponentPropsWithRef } from "react";
import { AIMark } from "./AIMark";
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
/** Cosmetic word rotation beside the turning AI mark; no execution-state
 * transitions. */
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
      {!textOnly && <AIMark size="xs" working />}
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
