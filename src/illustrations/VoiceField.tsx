import { useEffect, useRef, useState } from "react";

export interface VoiceFieldProps {
  language?: "ar" | "en";
  animated?: boolean;
  interactive?: boolean;
  className?: string;
}

type VoiceState = "idle" | "listening" | "thinking" | "speaking";
type Point = { x: number; y: number; z: number; accent: number };
type Seed = { latitude: number; longitude: number; index: number };
type Driver = {
  select: (state: VoiceState) => void;
  settle: (state: VoiceState) => void;
  demonstrate: () => void;
};
const states: VoiceState[] = ["idle", "listening", "thinking", "speaking"];
const labels = {
  ar: {
    idle: "هدوء",
    listening: "استماع",
    thinking: "تفكير",
    speaking: "تحدث",
  },
  en: {
    idle: "Idle",
    listening: "Listening",
    thinking: "Thinking",
    speaking: "Speaking",
  },
};
const tau = Math.PI * 2;
// Equal arc spacing along each latitude keeps the poles airy and the surface
// legible. Staggered longitudes prevent the points from becoming a wireframe.
const seeds: Seed[] = Array.from({ length: 22 }, (_, row) => {
  const latitude = ((row + 0.5) / 22) * Math.PI;
  const count = Math.round(41 * Math.sin(latitude));
  return Array.from({ length: count }, (_, column) => ({
    latitude,
    longitude: ((column + (row % 2) * 0.5) / count) * tau,
    index: 0,
  }));
})
  .flat()
  .map((seed, index) => ({ ...seed, index }));

function position(seed: Seed, state: VoiceState, phase: number): Point {
  const { latitude, longitude, index } = seed;
  const sin = Math.sin(latitude);
  const y = Math.cos(latitude);
  const turn = longitude + 0.38 + phase * 0.16;
  let x = sin * Math.cos(turn);
  let z = sin * Math.sin(turn);
  let vertical = y;
  let accent = 0;
  if (state === "listening") {
    const wave = Math.sin(latitude * 7 - phase * 2.7 + longitude * 2);
    const breath = 1.12 + Math.sin(phase * 2) * 0.045;
    const reach = breath + wave * 0.075;
    x *= reach;
    z *= reach;
    vertical *= breath + wave * 0.05;
    accent = Math.max(0, wave) * 0.55;
  } else if (state === "thinking") {
    const angle =
      (Math.floor(index / 6) / Math.ceil(seeds.length / 6)) * tau + phase * 0.7;
    const band = (index % 6) / 5 - 0.5;
    const radius = 1.02 + band * 0.13;
    const ringX = Math.cos(angle) * radius;
    const ringY = Math.sin(angle) * radius;
    // A tilted narrow annulus: the near rim remains visibly in front.
    x = ringX * 0.88 - ringY * 0.31;
    vertical = ringX * 0.28 + ringY * 0.57;
    z = ringY * 0.77 + band * 0.06;
    accent = (Math.sin(angle - phase * 1.2) + 1) * 0.5;
  } else if (state === "speaking") {
    const wave = Math.sin(latitude * 10 - phase * 3.3);
    const envelope = Math.pow(sin, 1.5);
    const radius = 1 + wave * 0.13 * envelope;
    x *= radius;
    z *= radius;
    vertical = y * 0.94 + wave * 0.025;
    accent = Math.max(0, wave) * envelope;
  }
  // The camera looks very slightly down on the field, with no mirrored light.
  return {
    x,
    y: vertical * 0.985 - z * 0.17,
    z: z * 0.985 + vertical * 0.17,
    accent,
  };
}

function smooth(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

const css = `
.voice-field { position: relative; inline-size: 100%; min-inline-size: 0; color: var(--text); font-family: var(--font); }
.voice-field .voice-field-art { position: relative; inline-size: 100%; aspect-ratio: 3 / 2; overflow: hidden; }
.voice-field canvas, .voice-field .voice-field-fallback { display: block; position: absolute; inset: 0; inline-size: 100%; block-size: 100%; pointer-events: none; }
.voice-field[data-canvas-ready="true"] .voice-field-fallback { visibility: hidden; }
.voice-field .voice-field-palette { position: absolute; inline-size: 0; block-size: 0; overflow: hidden; visibility: hidden; pointer-events: none; }
.voice-field .voice-field-sage { color: var(--action); }
.voice-field .voice-field-violet { color: var(--ai); }
.voice-field .voice-field-ink { color: var(--text-secondary); }
.voice-field .voice-field-controls { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-1); padding: var(--space-1); margin-inline: auto; margin-block: 0 var(--space-4); inline-size: fit-content; max-inline-size: calc(100% - var(--space-4) * 2); border-radius: var(--radius-control); background: var(--surface-tray); }
.voice-field .voice-field-control { appearance: none; border: 1px solid transparent; border-radius: var(--radius-control); min-block-size: var(--control-small); padding-block: var(--space-1); padding-inline: var(--space-3); background: transparent; color: var(--text-secondary); font: inherit; font-size: var(--text-label); font-weight: var(--weight-medium); line-height: var(--leading-meta); cursor: pointer; transition: background var(--motion-state) var(--ease-out), color var(--motion-state) var(--ease-out), box-shadow var(--motion-state) var(--ease-out); }
@media (hover: hover) and (pointer: fine) {
  .voice-field .voice-field-control:hover { background: var(--surface-hover); color: var(--text); }
}
.voice-field .voice-field-control[aria-pressed="true"] { background: var(--surface); color: var(--text); box-shadow: var(--shadow-control); border-color: var(--hairline); }
.voice-field .voice-field-control:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
`;

/** Original, decorative Canvas 2D artwork. No audio is recorded or requested.
 * Copy this file with Tiraz's tokens.css; React owns the controls, while the
 * canvas owns intermediate frames. All demonstrations have a finite end. */
export function VoiceField({
  language = "ar",
  animated = false,
  interactive = false,
  className,
}: VoiceFieldProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const driver = useRef<Driver | null>(null);
  const selectedRef = useRef<VoiceState>("idle");
  const [selected, setSelected] = useState<VoiceState>("idle");

  useEffect(() => {
    const host = root.current;
    const element = canvas.current;
    if (!host || !element) return;
    // jsdom has no renderer and its getContext stub logs an error before it
    // returns null. Keep the static depiction without invoking that stub.
    if (typeof CanvasRenderingContext2D === "undefined") return;
    let context: CanvasRenderingContext2D | null;
    try {
      context = element.getContext("2d");
    } catch {
      return;
    }
    if (!context) return;
    const ctx = context;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let duration = 0;
    let visible = true;
    let frame = 0;
    let previousTime: number | null = null;
    let elapsed = 0;
    let running = false;
    let demo = false;
    let state: VoiceState = selectedRef.current;
    let segment = 0;
    let segmentStart = 0;
    let points = seeds.map((seed) => position(seed, state, 0));
    let origin = points.map((point) => ({ ...point }));
    let palette = { sage: "", violet: "", ink: "" };
    let width = 600;
    let height = 400;

    const readSettings = () => {
      const style = getComputedStyle(host);
      const token = style.getPropertyValue("--motion-panel").trim();
      const numeric = Number.parseFloat(token);
      duration = Number.isFinite(numeric)
        ? numeric * (token.endsWith("ms") ? 1 : 1000)
        : 0;
      if (media?.matches) duration = 0;
      for (const key of ["sage", "violet", "ink"] as const) {
        const probe = host.querySelector(`.voice-field-${key}`);
        palette[key] = probe ? getComputedStyle(probe).color : style.color;
      }
    };

    const paint = () => {
      const scale = width / 600;
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      const halo = ctx.createRadialGradient(-14, -12, 4, 0, 0, 153);
      halo.addColorStop(0, palette.sage);
      halo.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.045;
      ctx.fillStyle = halo;
      ctx.fillRect(-160, -160, 320, 320);
      const sorted = [...points].sort((a, b) => a.z - b.z);
      for (const point of sorted) {
        const depth = Math.min(1, Math.max(0, (point.z + 1.25) / 2.5));
        const perspective = 1 + point.z * 0.065;
        const light = Math.min(
          1,
          Math.max(0, 0.65 - point.x * 0.12 - point.y * 0.2 + point.z * 0.17),
        );
        const radius = 0.58 + depth * 1.04;
        ctx.globalAlpha = 0.16 + depth * 0.66 + light * 0.1;
        const violet =
          point.accent > 0.62 ||
          (state === "idle" && point.x > 0.38 && point.y > 0.12 && point.z > 0);
        ctx.fillStyle = violet
          ? palette.violet
          : point.z < -0.5
            ? palette.ink
            : palette.sage;
        ctx.beginPath();
        ctx.arc(
          point.x * 116 * perspective,
          point.y * 116 * perspective,
          radius,
          0,
          tau,
        );
        ctx.fill();
      }
      ctx.restore();
    };

    const resize = () => {
      const bounds = element.getBoundingClientRect();
      width = bounds.width || 600;
      height = bounds.height || (width * 2) / 3;
      const ratio = Math.min(window.devicePixelRatio || 1, 3);
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint();
    };

    const cancel = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previousTime = null;
    };

    const reflect = (next: VoiceState) => {
      selectedRef.current = next;
      setSelected(next);
    };

    const still = (next: VoiceState) => {
      cancel();
      running = false;
      state = next;
      reflect(next);
      points = seeds.map((seed) => position(seed, state, 0));
      paint();
    };

    const tick = (time: number) => {
      frame = 0;
      if (!running || !visible || document.hidden) {
        previousTime = null;
        return;
      }
      if (previousTime !== null)
        elapsed += Math.min(time - previousTime, duration);
      previousTime = time;
      const length = duration * (demo ? 24 : 14);
      if (demo) {
        const nextSegment = Math.min(3, Math.floor(elapsed / (duration * 6)));
        if (nextSegment !== segment) {
          segment = nextSegment;
          segmentStart = elapsed;
          origin = points.map((point) => ({ ...point }));
          state = (["listening", "thinking", "speaking", "idle"] as const)[
            segment
          ];
          reflect(state);
        }
      }
      const morph = smooth((elapsed - segmentStart) / (duration * 2.4));
      // The phase eases to its endpoint, so the final frame stops gently.
      const progress = Math.min(1, elapsed / length);
      const phase = 4.8 * (1 - Math.pow(1 - progress, 2));
      points = seeds.map((seed, index) => {
        const target = position(seed, state, phase);
        const from = origin[index];
        return {
          x: from.x + (target.x - from.x) * morph,
          y: from.y + (target.y - from.y) * morph,
          z: from.z + (target.z - from.z) * morph,
          accent: from.accent + (target.accent - from.accent) * morph,
        };
      });
      paint();
      if (elapsed < length) frame = requestAnimationFrame(tick);
      else {
        running = false;
        previousTime = null;
      }
    };

    const start = (next: VoiceState, sequence = false) => {
      readSettings();
      cancel();
      state = next;
      reflect(next);
      demo = sequence;
      segment = 0;
      segmentStart = 0;
      elapsed = 0;
      origin = points.map((point) => ({ ...point }));
      if (duration <= 0) {
        still(sequence ? "idle" : next);
        return;
      }
      running = true;
      if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    };

    const refresh = () => {
      readSettings();
      if (duration <= 0 && running) still(demo ? "idle" : selectedRef.current);
      else paint();
    };
    const visibility = () => {
      if (document.hidden || !visible) cancel();
      else if (running && !frame) frame = requestAnimationFrame(tick);
    };
    driver.current = {
      select: (next) => start(next),
      settle: still,
      demonstrate: () => start("listening", true),
    };
    readSettings();
    resize();
    host.dataset.canvasReady = "true";
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    resizeObserver?.observe(element);
    const intersection =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            visibility();
          });
    intersection?.observe(host);
    const mutation = new MutationObserver(refresh);
    // Only ancestors carry theme, reduced-motion, and keyboard modality. Do
    // not observe canvas attributes, which change on every resize.
    for (
      let ancestor: HTMLElement | null = host;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      mutation.observe(ancestor, {
        attributes: true,
        attributeFilter: [
          "data-theme",
          "data-accent",
          "data-reduced-motion",
          "data-modality",
          "style",
          "class",
        ],
      });
    }
    media?.addEventListener("change", refresh);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", resize);
    return () => {
      cancel();
      driver.current = null;
      resizeObserver?.disconnect();
      intersection?.disconnect();
      mutation.disconnect();
      media?.removeEventListener("change", refresh);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", resize);
      delete host.dataset.canvasReady;
    };
  }, []);

  useEffect(() => {
    if (animated) driver.current?.demonstrate();
    else driver.current?.settle(selectedRef.current);
  }, [animated]);

  function select(state: VoiceState) {
    selectedRef.current = state;
    setSelected(state);
    driver.current?.select(state);
  }

  return (
    <div
      ref={root}
      className={["voice-field", className].filter(Boolean).join(" ")}
      data-illustration="voice-field"
      data-animated={animated}
      data-state={selected}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <style href="tiraz-voice-field" precedence="illustrations">
        {css}
      </style>
      <div className="voice-field-art" aria-hidden="true">
        <canvas ref={canvas} width="600" height="400" />
        <svg
          className="voice-field-fallback"
          viewBox="0 0 600 400"
          focusable="false"
        >
          {seeds
            .filter((_, index) => index % 3 === 0)
            .map((seed) => {
              const point = position(seed, selected, 0);
              const depth = (point.z + 1.25) / 2.5;
              return (
                <circle
                  key={seed.index}
                  cx={300 + point.x * 116}
                  cy={200 + point.y * 116}
                  r={0.7 + depth}
                  fill={point.accent > 0.62 ? "var(--ai)" : "var(--action)"}
                  opacity={0.2 + depth * 0.6}
                />
              );
            })}
        </svg>
      </div>
      <span className="voice-field-palette" aria-hidden="true">
        <span className="voice-field-sage" />
        <span className="voice-field-violet" />
        <span className="voice-field-ink" />
      </span>
      {interactive && (
        <div
          className="voice-field-controls"
          role="group"
          aria-label={language === "ar" ? "حالة الصوت" : "Voice state"}
        >
          {states.map((state) => (
            <button
              key={state}
              type="button"
              className="voice-field-control"
              aria-pressed={selected === state}
              onClick={() => select(state)}
            >
              {labels[language][state]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
