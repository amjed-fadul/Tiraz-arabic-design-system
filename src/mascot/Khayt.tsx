import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../system/useReducedMotion";
import { drawKhayt, khaytSprites } from "./khayt-renderer";
import { isLooping, khaytPose, mixPose } from "./khayt-motion";
import type { KhaytPose, KhaytState } from "./khayt-motion";
import bodyUrl from "./assets/khayt-body.png";
import eyeUrl from "./assets/khayt-eye.png";
import threadUrl from "./assets/khayt-thread.png";
import "./khayt.css";

export interface KhaytProps {
  state?: KhaytState;
  color?: string;
  animated?: boolean;
  size?: number;
  className?: string;
}

/** Decorative identity; the host supplies the agent name and textual status. */
export function Khayt({
  state = "idle",
  color = "#946D91",
  animated = false,
  size,
  className = "",
}: KhaytProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const control = useRef<
    (state: KhaytState, animated: boolean, reduced: boolean) => void
  >(() => {});
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const latest = useRef({ state, animated: animated && !reduced, reduced });
  const saved = useRef<{
    state: KhaytState;
    elapsed: number;
    transition: number;
    pose: KhaytPose;
    from: KhaytPose;
  } | null>(null);
  useEffect(() => {
    latest.current = { state, animated: animated && !reduced, reduced };
    control.current(state, animated && !reduced, reduced);
  }, [state, animated, reduced]);

  useEffect(() => {
    const node = canvas.current;
    if (!node || typeof CanvasRenderingContext2D === "undefined") return;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    let disposed = false,
      visible = true,
      frame = 0,
      previous = 0;
    const previousPose =
      saved.current?.state === latest.current.state ? saved.current : null;
    let elapsed = previousPose?.elapsed ?? 0,
      transition = previousPose?.transition ?? 1;
    let current = latest.current.state,
      playing = latest.current.animated;
    let pose = previousPose?.pose ?? khaytPose(current, 0, !playing),
      from = previousPose?.from ?? pose;
    let sprites: Awaited<ReturnType<typeof khaytSprites>> | undefined;
    const paint = () => {
      if (sprites) drawKhayt(ctx, sprites, pose);
    };
    const active = () =>
      !disposed &&
      playing &&
      visible &&
      document.visibilityState !== "hidden" &&
      (isLooping(current) || elapsed < 1.2 || transition < 1);
    const tick = (now: number) => {
      frame = 0;
      if (!active() || !sprites) return;
      const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      elapsed += delta;
      transition = Math.min(1, transition + delta / 0.42);
      pose = mixPose(from, khaytPose(current, elapsed), transition);
      paint();
      if (active()) frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (sprites && active()) frame = requestAnimationFrame(tick);
    };
    control.current = (next, nextPlaying, nextReduced) => {
      const changed = next !== current;
      if (changed) {
        from = pose;
        current = next;
        elapsed = 0;
        transition = 0;
      }
      playing = nextPlaying;
      if (nextReduced || (!playing && changed)) {
        pose = khaytPose(current, elapsed, true);
        paint();
      }
      schedule();
    };
    const resize = () => {
      const pixels = Math.max(
        1,
        Math.round(
          node.getBoundingClientRect().width *
            Math.min(window.devicePixelRatio || 1, 2),
        ),
      );
      if (node.width !== pixels) {
        node.width = pixels;
        node.height = pixels;
      }
      paint();
    };
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(node);
    const intersection =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            schedule();
          })
        : null;
    intersection?.observe(node);
    document.addEventListener("visibilitychange", schedule);
    khaytSprites(color)
      .then((loaded) => {
        if (disposed) return;
        sprites = loaded;
        resize();
        paint();
        setReady(true);
        schedule();
      })
      .catch(() => {
        if (!disposed) setReady(false);
      });
    return () => {
      saved.current = { state: current, elapsed, transition, pose, from };
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      intersection?.disconnect();
      document.removeEventListener("visibilitychange", schedule);
      control.current = () => {};
    };
  }, [color]);

  return (
    <span
      className={`khayt ${className}`}
      style={size ? { inlineSize: size } : undefined}
      aria-hidden="true"
      data-illustration="khayt"
      data-state={state}
      data-ready={ready}
      data-animated={animated && !reduced}
    >
      <span className="khayt-fallback">
        <img className="khayt-fallback-thread" src={threadUrl} alt="" />
        <img className="khayt-fallback-body" src={bodyUrl} alt="" />
        <img className="khayt-fallback-eye" src={eyeUrl} alt="" />
        <img
          className="khayt-fallback-eye khayt-fallback-eye-second"
          src={eyeUrl}
          alt=""
        />
      </span>
      <canvas ref={canvas} />
    </span>
  );
}

export function KhaytIllustration({
  animated = false,
}: {
  animated?: boolean;
}) {
  return (
    <Khayt state="working" animated={animated} className="khayt-gallery" />
  );
}
