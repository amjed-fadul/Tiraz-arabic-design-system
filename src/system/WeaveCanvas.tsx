import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useReducedMotion } from "./useReducedMotion";

export interface WeaveCanvasProps {
  /** Application-owned preview URL. Without one the canvas shows a halftone field. */
  src?: string;
  /** Actual host progress from 0 to 100; omit or pass null while it is unknown. */
  progress?: number | null;
  status: "queued" | "weaving" | "completed" | "failed";
  /** Names the whole box as one image. */
  alt: string;
  className?: string;
}

const easeMs = 130;

// The dots stay on a regular grid. Two drifting, soft regions change their
// radius, forming a monochrome halftone wave rather than moving particles.
function drawField(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsed: number,
) {
  const phase = elapsed * 0.00048 - 2.3;
  const x = 0.5 + Math.cos(phase) * 0.43;
  const y = 0.5 + Math.sin(phase * 1.18) * 0.43;
  const spreadX = Math.max(44, width * 0.19);
  const spreadY = Math.max(40, height * 0.25);
  const spacing = 8;
  context.clearRect(0, 0, width, height);
  for (let top = 4; top < height; top += spacing) {
    for (let left = 4; left < width; left += spacing) {
      const a =
        ((left - x * width) / spreadX) ** 2 +
        ((top - y * height) / spreadY) ** 2;
      const b =
        ((left - (1 - x) * width) / spreadX) ** 2 +
        ((top - (1 - y) * height) / spreadY) ** 2;
      const intensity = Math.min(1, Math.exp(-a * 2) + Math.exp(-b * 2));
      const radius = 0.12 + intensity * 1.85;
      // Separate paths preserve circular antialiasing for subpixel dots;
      // a large compound path can tessellate the smallest arcs unevenly.
      context.beginPath();
      context.arc(left, top, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
}

/**
 * A still charcoal canvas becomes a drifting halftone field while weaving.
 * Only actual host progress reveals the supplied image; an unknown wait
 * never advances it. Failure freezes both the field and the reveal. Motion
 * preferences keep the field still. The box alone is named by `alt`;
 * progress and announcements remain the owner's responsibility.
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
    status === "completed" ? 1 : status === "weaving" ? (share ?? 0) : 0;
  const hold = status === "failed";
  const [first] = useState(() => (hold ? 0 : goal));
  const [loaded, setLoaded] = useState<string>();
  const box = useRef<HTMLDivElement>(null),
    field = useRef<HTMLCanvasElement>(null),
    elapsed = useRef(0),
    shown = useRef(first);

  // This short loop smooths only real progress. The decorative field has its
  // own clock, which cannot advance the image reveal or report a percentage.
  useEffect(() => {
    const node = box.current;
    if (!node || hold) return;
    const paint = (focus: number) => {
      shown.current = focus;
      node.style.setProperty("--weave-focus", String(focus));
    };
    if (reduced || goal <= shown.current) {
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

  useEffect(() => {
    const canvas = field.current;
    if (!canvas) return;
    if (status === "queued") elapsed.current = 0;
    const moving = status === "weaving" && !reduced;
    let frame: number | undefined;
    let context: CanvasRenderingContext2D | null = null;
    let width = 0,
      height = 0,
      last = 0,
      painted = 0;
    const draw = () => {
      if (context) drawField(context, width, height, elapsed.current);
    };
    const step = (now: number) => {
      frame = undefined;
      // Thirty frames per second keeps the fine dot field smooth without
      // painting at the display's potentially much higher refresh rate.
      if (now - painted >= 1000 / 30) {
        elapsed.current += Math.min(64, Math.max(0, now - last));
        last = now;
        draw();
        painted = now;
      }
      frame = requestAnimationFrame(step);
    };
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) {
        if (frame !== undefined) cancelAnimationFrame(frame);
        frame = undefined;
        return;
      }
      context = canvas.getContext("2d");
      if (!context) return;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.fillStyle =
        getComputedStyle(canvas).getPropertyValue("--weave-dot");
      draw();
      if (moving && frame === undefined) {
        last = performance.now();
        frame = requestAnimationFrame(step);
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [status, reduced]);

  return (
    <div
      ref={box}
      role="img"
      aria-label={alt}
      className={`tz-weave ${className}`}
      data-status={status}
      data-preview={(!!src && loaded === src) || undefined}
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
          onLoad={() => setLoaded(src)}
          onError={() => setLoaded(undefined)}
        />
      )}
      <canvas ref={field} className="tz-weave-development" aria-hidden="true" />
    </div>
  );
}
