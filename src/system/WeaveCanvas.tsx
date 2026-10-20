import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Thread } from "./Thread";
import { useReducedMotion } from "./useReducedMotion";
import { useSystem } from "./useSystem";
import { rowFronts, weaveClip, weaveRows } from "./weave";

export interface WeaveCanvasProps {
  /** Application-owned URL of the picture to weave in. Without one the loom shows its warp threads and nothing else. */
  src?: string;
  /** Actual host progress from 0 to 100; omit or pass null while it is unknown. */
  progress?: number | null;
  status: "queued" | "weaving" | "completed" | "failed";
  /** Names the whole box as one image. */
  alt: string;
  className?: string;
}

// The unknown wait gives one row this long to its shuttle. A weave that is
// following the host takes at least the shortest and at most the longest (Woven
// spec section 15 allows the image weave up to 1,200 ms).
const passMs = 520,
  shortestMs = 400,
  longestMs = 1200;

/**
 * Image reveal that weaves rows in from the inline-start edge (Woven spec
 * section 14): faint warp threads, then the picture row by row, bottom row
 * first, with a thread-colored shuttle at each row's front and a faint weft
 * line behind it that goes when the row is done. With progress the reveal
 * follows it; without, one shuttle crosses the rows until a picture arrives,
 * and the weave then finishes in under 1.2 s. Under reduced motion nothing
 * loops: a still thread says the loom is working, and the picture fades in
 * whole. Everything but the box is decoration, so the box is one image named
 * by `alt`; progress is the owner's to expose.
 */
export function WeaveCanvas({
  src,
  progress,
  status,
  alt,
  className = "",
}: WeaveCanvasProps) {
  const { config } = useSystem(),
    reduced = useReducedMotion(),
    direction = config.direction === "rtl" ? "rtl" : "ltr";
  const share =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.min(1, Math.max(0, progress / 100))
      : undefined;
  // How much of the picture the host's state asks to have woven.
  const goal =
    status === "completed"
      ? 1
      : status === "weaving"
        ? (share ?? (src ? 1 : 0))
        : 0;
  const hold = status === "failed",
    looping = status === "weaving" && share === undefined && !src;
  // Under reduced motion the picture is absent or whole, and fades in.
  const fade = reduced && !!src && goal >= 1,
    still = reduced && status === "weaving" && !fade;

  const box = useRef<HTMLDivElement>(null),
    list = useRef<HTMLSpanElement>(null);
  // What the screen shows on mount is never animated into.
  const [first] = useState(() => {
    const fraction = reduced ? 1 : hold ? 0 : goal;
    return {
      fraction,
      clip: weaveClip(fraction, direction),
      fronts: rowFronts(fraction),
    };
  });
  const shown = useRef(first.fraction);

  // The one loop. It writes the clip and the rows straight to the DOM, and
  // runs only while something moves: an unknown wait, or a weave catching up.
  useEffect(() => {
    const node = box.current,
      rows = list.current;
    if (!node || !rows) return;
    const lines = Array.from(rows.children) as HTMLElement[];
    const paint = (fraction: number) => {
      shown.current = fraction;
      node.style.setProperty("--weave-clip", weaveClip(fraction, direction));
      const fronts = rowFronts(fraction);
      lines.forEach((line, index) =>
        line.style.setProperty("--front", fronts[index].toFixed(3)),
      );
    };
    if (reduced) {
      paint(1);
      return;
    }
    if (hold) {
      // A failed weave stays where it stopped, without its shuttles.
      for (const line of lines) line.style.setProperty("--front", "1");
      return;
    }
    let frame = 0;
    const began = performance.now();
    if (looping) {
      paint(0);
      const step = (now: number) => {
        const pass = Math.max(0, now - began) / passMs,
          row = Math.floor(pass);
        // One shuttle crosses one row at a time, climbing from the bottom.
        const active = weaveRows - 1 - (row % weaveRows);
        lines.forEach((line, index) =>
          line.style.setProperty(
            "--front",
            index === active ? (pass - row).toFixed(3) : "0",
          ),
        );
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
      return () => cancelAnimationFrame(frame);
    }
    const from = shown.current;
    if (goal <= from) {
      paint(goal);
      return;
    }
    const span = Math.min(
      longestMs,
      Math.max(shortestMs, (goal - from) * longestMs),
    );
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, now - began) / span);
      paint(from + (goal - from) * (t * t * (3 - 2 * t)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [direction, goal, hold, looping, reduced]);

  return (
    <div
      ref={box}
      role="img"
      aria-label={alt}
      className={`tz-weave ${className}`}
      data-status={status}
      data-fade={fade || undefined}
      style={{ "--weave-clip": first.clip } as CSSProperties}
    >
      <span className="tz-weave-warp" aria-hidden="true" />
      {!!src && (!reduced || fade) && (
        <img
          className="tz-weave-image"
          src={src}
          alt=""
          aria-hidden="true"
          decoding="async"
        />
      )}
      <span ref={list} className="tz-weave-rows" aria-hidden="true">
        {first.fronts.map((front, index) => (
          <span
            key={index}
            className="tz-weave-row"
            style={{ "--front": front.toFixed(3) } as CSSProperties}
          >
            <span className="tz-weave-weft" />
            <span className="tz-weave-shuttle" />
          </span>
        ))}
      </span>
      {still && (
        <span className="tz-weave-still" aria-hidden="true">
          <Thread state="running" />
        </span>
      )}
    </div>
  );
}
