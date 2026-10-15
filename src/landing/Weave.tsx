import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "../system/Button";
import { useSystem } from "../system/useSystem";
import { accentColors } from "../system/config";
import type { WeaveAppearance, WeaveController } from "./weave-shader";

/** A real image is always present. The optional canvas samples that same image. */
export function Weave({ src }: { src: string }) {
  const { config } = useSystem();
  const host = useRef<HTMLDivElement>(null),
    image = useRef<HTMLImageElement>(null);
  const controller = useRef<WeaveController | undefined>(undefined);
  const desired = useRef<WeaveAppearance>({
    tint: accentColors[config.accent].light,
    dark: config.theme === "dark",
  });
  const [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(false);
  const pauseRef = useRef(paused),
    updateActivity = useRef<() => void>(() => {});
  useEffect(() => {
    desired.current = {
      tint: accentColors[config.accent].light,
      dark: config.theme === "dark",
    };
    controller.current?.update(desired.current);
  }, [config.accent, config.theme]);
  useEffect(() => {
    pauseRef.current = paused;
    updateActivity.current();
  }, [paused]);
  useEffect(() => {
    const element = host.current,
      photo = image.current;
    if (!element || !photo || !("IntersectionObserver" in window)) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false,
      visible = false,
      loading = false,
      attempted = false;
    const stop = () => {
      controller.current?.dispose();
      controller.current = undefined;
    };
    const update = () => {
      if (disposed) return;
      setReduced(media.matches);
      if (media.matches) {
        stop();
        attempted = false;
        return;
      }
      const active = visible && !document.hidden && !pauseRef.current;
      if (controller.current) {
        controller.current.setRunning(active);
        return;
      }
      if (
        !active ||
        loading ||
        attempted ||
        !photo.complete ||
        !photo.naturalWidth
      )
        return;
      loading = true;
      void import("./weave-shader")
        .then(({ mountWeave }) => {
          loading = false;
          if (disposed || media.matches) return;
          attempted = true;
          controller.current = mountWeave(element, photo, desired.current);
          controller.current?.setRunning(
            visible && !document.hidden && !pauseRef.current,
          );
        })
        .catch(() => {
          loading = false;
          attempted = true;
        });
    };
    updateActivity.current = update;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    photo.addEventListener("load", update);
    update();
    return () => {
      disposed = true;
      observer.disconnect();
      stop();
      updateActivity.current = () => {};
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      photo.removeEventListener("load", update);
    };
  }, [src]);
  return (
    <>
      <div
        ref={host}
        className="lp-weave"
        data-effect="fallback"
        aria-hidden="true"
      >
        <img
          ref={image}
          className="lp-weave-image"
          src={src}
          alt=""
          decoding="async"
          fetchPriority="high"
        />
      </div>
      {!reduced && (
        <div className="lp-motion-control">
          <Button
            variant="ghost"
            iconOnly
            aria-label={
              paused
                ? config.direction === "rtl"
                  ? "تشغيل تأثير النسيج"
                  : "Play textile effect"
                : config.direction === "rtl"
                  ? "إيقاف تأثير النسيج"
                  : "Pause textile effect"
            }
            aria-pressed={paused}
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
