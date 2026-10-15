import { useEffect, useId, useRef } from "react";

/** Always-visible static artwork; optional shader never owns content. */
export function Weave({ dark }: { dark: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    const element = host.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let cleanup: (() => void) | undefined;
    let loading = false;
    let visible = false;
    const stop = () => {
      cleanup?.();
      cleanup = undefined;
    };
    const update = () => {
      if (disposed || media.matches || !visible || document.hidden) {
        stop();
        return;
      }
      if (cleanup || loading) return;
      loading = true;
      void import("./weave-shader")
        .then(({ mountWeave }) => {
          loading = false;
          if (!disposed && !media.matches && visible && !document.hidden) {
            cleanup = mountWeave(element, dark);
          }
        })
        .catch(() => {
          loading = false;
        });
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      disposed = true;
      observer.disconnect();
      stop();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [dark]);
  return (
    <div ref={host} className="lp-weave" aria-hidden="true">
      <svg viewBox="0 0 540 380" fill="none" className="lp-weave-static">
        <defs>
          <pattern
            id={id}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <path
              d="M0 0v24M5 0v24M10 0v24M15 0v24M20 0v24"
              stroke="currentColor"
              strokeWidth=".7"
            />
            <path d="M0 0h24M0 12h24" stroke="currentColor" strokeWidth="1.5" />
          </pattern>
        </defs>
        <path d="M270 30 430 190 270 350 110 190Z" fill={`url(#${id})`} />
        <path
          d="m270 77 113 113-113 113-113-113Z"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="m270 125 65 65-65 65-65-65Z"
          fill="var(--surface-page)"
          stroke="currentColor"
        />
        <path d="m270 155 35 35-35 35-35-35Z" fill={`url(#${id})`} />
      </svg>
      <span className="lp-weave-axis lp-weave-axis-a" />
      <span className="lp-weave-axis lp-weave-axis-b" />
    </div>
  );
}
