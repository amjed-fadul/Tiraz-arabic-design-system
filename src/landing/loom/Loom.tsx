import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "../../system/Button";
import { accentColors } from "../../system/config";
import { useSystem } from "../../system/useSystem";
import { loomPalette } from "./loom-palette";
import type { LoomController } from "./loom-renderer";
import {
  WEAVE_ROWS,
  composeWeaveMask,
  rasterizeInscription,
} from "./weave-mask";
import type { InscriptionFont } from "./weave-mask";

const INSCRIPTION = "طِراز";
const DISPLAY: InscriptionFont = {
  family: '"Thmanyah Serif Display"',
  weight: 900,
};
const FALLBACK: InscriptionFont = {
  family: '"IBM Plex Sans Arabic"',
  weight: 600,
};
const REDUCED = "(prefers-reduced-motion: reduce)";

type Effect = "pending" | "live" | "static";

/**
 * The hero loom. Warp threads and a woven band with a real inscription are
 * drawn in WebGL behind the hero copy. Without WebGL the same band is shown as
 * a static woven panel; reduced motion gets one finished frame.
 */
export function Loom({
  band,
  ar,
}: {
  band: RefObject<HTMLElement | null>;
  ar: boolean;
}) {
  const { config } = useSystem();
  const host = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLCanvasElement>(null);
  const controller = useRef<LoomController | undefined>(undefined);
  const palette = useMemo(
    () => loomPalette(config.theme, accentColors[config.accent][config.theme]),
    [config.theme, config.accent],
  );
  const paletteRef = useRef(palette);
  const [effect, setEffect] = useState<Effect>(() =>
    typeof WebGLRenderingContext === "undefined" ? "static" : "pending",
  );
  const [reduced, setReduced] = useState(() => matchMedia(REDUCED).matches);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    paletteRef.current = palette;
    controller.current?.setPalette(palette);
  }, [palette]);

  useEffect(() => {
    pausedRef.current = paused;
    refresh.current();
  }, [paused]);

  useEffect(() => {
    const media = matchMedia(REDUCED);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const layer = host.current;
    const canvas = surface.current;
    const slot = band.current;
    const hero = layer?.parentElement;
    if (!layer || !canvas || !slot || !hero) return;
    let disposed = false;
    let visible = true;

    const measure = () => {
      const area = hero.getBoundingClientRect();
      const strip = slot.getBoundingClientRect();
      const top = strip.top - area.top;
      layer.style.setProperty("--band-top", `${top}px`);
      layer.style.setProperty("--band-height", `${strip.height}px`);
      const live = controller.current;
      const cell = strip.height / WEAVE_ROWS;
      if (!live || !cell || !area.width) return;
      const cols = Math.ceil(area.width / cell) + 2;
      const font = document.fonts?.check(
        `${DISPLAY.weight} 40px ${DISPLAY.family}`,
        INSCRIPTION,
      )
        ? DISPLAY
        : FALLBACK;
      live.setLayout({
        width: area.width,
        height: area.height,
        dpr: Math.min(window.devicePixelRatio || 1, 1.75),
        bandTop: top,
        bandHeight: strip.height,
        cols,
        rows: WEAVE_ROWS,
        mask: composeWeaveMask(
          cols,
          WEAVE_ROWS,
          rasterizeInscription(cols, WEAVE_ROWS, INSCRIPTION, font),
        ),
      });
    };
    const update = () => {
      controller.current?.setRunning(
        visible && !document.hidden && !pausedRef.current,
      );
    };
    refresh.current = update;
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const area = hero.getBoundingClientRect();
      controller.current?.setPointer(
        event.clientX - area.left,
        event.clientY - area.top,
        event.type !== "pointerleave",
      );
    };

    measure();
    const resize =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(measure)
        : undefined;
    resize?.observe(hero);
    const intersection =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            update();
          })
        : undefined;
    intersection?.observe(hero);
    window.addEventListener("resize", measure);
    document.addEventListener("visibilitychange", update);
    hero.addEventListener("pointermove", onPointer);
    hero.addEventListener("pointerleave", onPointer);

    if (typeof WebGLRenderingContext !== "undefined")
      void import("./loom-renderer")
        .then(({ mountLoom }) => {
          if (disposed) return;
          controller.current = mountLoom(canvas, {
            palette: paletteRef.current,
            still: reduced,
            startAt: import.meta.env.DEV
              ? Number(new URLSearchParams(location.search).get("loom")) || 0
              : 0,
            onLost: () => {
              controller.current = undefined;
              setEffect("static");
            },
          });
          if (!controller.current) {
            setEffect("static");
            return;
          }
          setEffect("live");
          measure();
          update();
          // Re-weave the inscription once the display face is ready.
          document.fonts
            ?.load(`${DISPLAY.weight} 40px ${DISPLAY.family}`, INSCRIPTION)
            .then(() => !disposed && measure())
            .catch(() => {});
        })
        .catch(() => !disposed && setEffect("static"));

    return () => {
      disposed = true;
      refresh.current = () => {};
      resize?.disconnect();
      intersection?.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", update);
      hero.removeEventListener("pointermove", onPointer);
      hero.removeEventListener("pointerleave", onPointer);
      controller.current?.dispose();
      controller.current = undefined;
    };
  }, [band, reduced]);

  return (
    <>
      <div
        ref={host}
        className="lp-loom"
        data-effect={effect}
        aria-hidden="true"
      >
        <canvas ref={surface} className="lp-loom-canvas" />
        <div className="lp-loom-static">
          <span lang="ar" dir="rtl">
            {INSCRIPTION}
          </span>
        </div>
      </div>
      {effect === "live" && !reduced && (
        <div className="lp-motion-control">
          <Button
            variant="ghost"
            iconOnly
            aria-pressed={paused}
            aria-label={
              paused
                ? ar
                  ? "تشغيل حركة النول"
                  : "Play loom animation"
                : ar
                  ? "إيقاف حركة النول"
                  : "Pause loom animation"
            }
            onClick={() => setPaused(!paused)}
          >
            {paused ? (
              <Play size={15} aria-hidden="true" />
            ) : (
              <Pause size={15} aria-hidden="true" />
            )}
          </Button>
        </div>
      )}
    </>
  );
}
