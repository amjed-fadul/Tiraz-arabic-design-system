import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Thread } from "./Thread";
import { useReducedMotion } from "./useReducedMotion";

export interface WeaveCanvasProps {
  /** Application-owned preview URL. Without one the canvas shows soft atmospheric light. */
  src?: string;
  /** Actual host progress from 0 to 100; omit or pass null while it is unknown. */
  progress?: number | null;
  status: "queued" | "weaving" | "completed" | "failed";
  /** Names the whole box as one image. */
  alt: string;
  className?: string;
}

// Only supplied progress changes clarity. An unknown wait has a fixed soft
// preview; the atmospheric motion does not advance it or imply completion.
const unknownFocus = 0.18,
  easeMs = 130;

/**
 * A whole-image preview that comes into focus as the host reports progress.
 * Soft light moves over the working canvas, then clears with completion.
 * Unknown progress keeps a soft preview until the host completes the job;
 * failure holds the current frame. Reduced motion shows a still canvas and
 * fades in the whole picture. The box alone is named by `alt`; progress and
 * announcements remain the owner's responsibility.
 */
export function WeaveCanvas({
  src,
  progress,
  status,
  alt,
  className = "",
}: WeaveCanvasProps) {
  const reduced = useReducedMotion();
  const share =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.min(1, Math.max(0, progress / 100))
      : undefined;
  const goal =
    status === "completed"
      ? 1
      : status === "weaving"
        ? (share ?? unknownFocus)
        : 0;
  const hold = status === "failed";
  const [first] = useState(() => (reduced ? 1 : hold ? 0 : goal));
  const box = useRef<HTMLDivElement>(null),
    shown = useRef(first);

  // This loop only smooths a real change of clarity and cancels immediately
  // on failure, reduced motion or unmount. Atmospheric motion is handled by
  // CSS, so an unknown wait needs no JavaScript animation loop.
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const paint = (focus: number) => {
      shown.current = focus;
      node.style.setProperty("--weave-focus", String(focus));
    };
    if (reduced) {
      paint(1);
      return;
    }
    if (hold) return;
    if (goal <= shown.current) {
      paint(goal);
      return;
    }
    let frame = 0,
      last = performance.now();
    const step = (now: number) => {
      const dt = Math.max(0, now - last);
      last = now;
      const next =
        shown.current + (goal - shown.current) * (1 - Math.exp(-dt / easeMs));
      if (goal - next < 0.002) {
        paint(goal);
        return;
      }
      paint(next);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [goal, hold, reduced]);

  return (
    <div
      ref={box}
      role="img"
      aria-label={alt}
      className={`tz-weave ${className}`}
      data-status={status}
      data-preview={!!src || undefined}
      data-reduced={reduced || undefined}
      style={{ "--weave-focus": first } as CSSProperties}
    >
      {!!src && status !== "queued" && (
        <img
          className="tz-weave-image"
          src={src}
          alt=""
          aria-hidden="true"
          decoding="async"
        />
      )}
      <span className="tz-weave-atmosphere" aria-hidden="true" />
      <span className="tz-weave-sheen" aria-hidden="true" />
      {reduced && status === "weaving" && !src && (
        <span className="tz-weave-still" aria-hidden="true">
          <Thread state="running" />
        </span>
      )}
    </div>
  );
}
