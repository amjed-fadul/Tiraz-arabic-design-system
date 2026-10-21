import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Thread } from "./Thread";
import { useReducedMotion } from "./useReducedMotion";

export interface WeaveCanvasProps {
  /** Application-owned preview URL. Without one the canvas shows flowing contours of light. */
  src?: string;
  /** Actual host progress from 0 to 100; omit or pass null while it is unknown. */
  progress?: number | null;
  status: "queued" | "weaving" | "completed" | "failed";
  /** Names the whole box as one image. */
  alt: string;
  className?: string;
}

// Only supplied progress resolves image cells. An unknown wait holds its
// reveal; flowing light never advances it or implies completion.
const unknownFocus = 0.18,
  easeMs = 130;

// Staggered cells have a stable, scattered reveal order. They cover one image,
// so there are no duplicated image requests or seams in the finished picture.
const cells = Array.from({ length: 8 }, (_, row) =>
  Array.from({ length: 11 }, (_, column) => ({
    x: column === 0 ? -30 : column * 60 - (row % 2 ? 30 : 0),
    y: row === 0 ? -20 : row * 50,
    width: column === 0 && row % 2 === 0 ? 91 : 61,
    height: row === 0 || row === 7 ? 71 : 51,
    order: ((row * 17 + column * 23) % 79) / 79,
  })),
).flat();
const contours = Array.from({ length: 22 }, (_, index) => {
  const spread = index - 10.5;
  return `M-100 ${200 + spread * 9} C70 ${20 + spread * 3} 140 ${370 + spread * 7} 310 ${195 + spread * 4} S500 ${65 + spread * 9} 700 ${210 + spread * 6}`;
});

/**
 * A developing image with flowing light and spatially resolving cells. Only
 * host progress changes the reveal; an unknown wait stays partly resolved.
 * Failure freezes the current frame. Reduced motion uses a still canvas and
 * a whole-image fade. The box alone is named by `alt`; progress and
 * announcements remain the owner's responsibility.
 */
export function WeaveCanvas({
  src,
  progress,
  status,
  alt,
  className = "",
}: WeaveCanvasProps) {
  const reduced = useReducedMotion(),
    uid = useId();
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

  // This loop only smooths a real progress change and cancels immediately
  // on failure, reduced motion or unmount. The light flows through CSS, so
  // an unknown wait needs no JavaScript animation loop.
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
      <svg
        className="tz-weave-development"
        viewBox="0 0 600 400"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`${uid}-light`} x1="0" y1="1" x2="1" y2="0">
            <stop className="tz-weave-light-edge" offset="0%" />
            <stop className="tz-weave-light-center" offset="46%" />
            <stop className="tz-weave-light-edge" offset="100%" />
          </linearGradient>
          <g id={`${uid}-contours`}>
            {contours.map((path, index) => (
              <path
                key={index}
                d={path}
                pathLength="100"
                style={{ "--contour": index } as CSSProperties}
              />
            ))}
          </g>
        </defs>
        <g className="tz-weave-cells">
          {cells.map(({ x, y, width, height, order }, index) => (
            <rect
              key={index}
              x={x}
              y={y}
              width={width}
              height={height}
              style={{ "--cell-order": order } as CSSProperties}
            />
          ))}
        </g>
        <g className="tz-weave-field">
          <use
            className="tz-weave-echo"
            href={`#${uid}-contours`}
            stroke={`url(#${uid}-light)`}
          />
          <g className="tz-weave-current">
            <use
              className="tz-weave-glow"
              href={`#${uid}-contours`}
              stroke={`url(#${uid}-light)`}
            />
            <use
              className="tz-weave-contours"
              href={`#${uid}-contours`}
              stroke={`url(#${uid}-light)`}
            />
            <g className="tz-weave-tracers" stroke={`url(#${uid}-light)`}>
              {contours
                .filter((_, index) => index % 3 === 0)
                .map((path, index) => (
                  <path
                    key={index}
                    d={path}
                    pathLength="100"
                    style={{ "--contour": index } as CSSProperties}
                  />
                ))}
            </g>
          </g>
        </g>
      </svg>
      {reduced && status === "weaving" && !src && (
        <span className="tz-weave-still" aria-hidden="true">
          <Thread state="running" />
        </span>
      )}
    </div>
  );
}
