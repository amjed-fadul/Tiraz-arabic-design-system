import { useEffect } from "react";
import type { RefObject } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Scroll-linked page motion: the header condenses, the hero loom recedes, the
 * live interface rises flat and the closing image settles. Values are written
 * as CSS custom properties from one frame-throttled listener. Reduced motion
 * receives the finished state.
 */
export function useLandingMotion(page: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = page.current;
    if (!root) return;
    const media = matchMedia(REDUCED);
    let frame = 0;
    const update = () => {
      frame = 0;
      const still = media.matches;
      const view = window.innerHeight || 1;
      root.setAttribute("data-scrolled", String(window.scrollY > 40));
      const hero = root.querySelector<HTMLElement>(".lp-hero");
      hero?.style.setProperty(
        "--hero-progress",
        still ? "0" : String(clamp(window.scrollY / view)),
      );
      const rise = root.querySelector<HTMLElement>(".lp-rise");
      if (rise) {
        const top = rise.getBoundingClientRect().top;
        rise.style.setProperty(
          "--rise",
          still ? "1" : String(smooth(clamp((view - top) / (view * 0.85)))),
        );
      }
      const closing = root.querySelector<HTMLElement>(".lp-closing-frame");
      if (closing) {
        const box = closing.getBoundingClientRect();
        closing.style.setProperty(
          "--settle",
          still ? "1" : String(clamp((view - box.top) / (view + box.height))),
        );
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Reveal blocks as they enter; without an observer everything stays visible.
    let reveals: IntersectionObserver | undefined;
    const arm = () => {
      reveals?.disconnect();
      const blocks = root.querySelectorAll<HTMLElement>("[data-reveal]");
      if (media.matches || typeof IntersectionObserver !== "function") {
        root.removeAttribute("data-motion");
        return;
      }
      root.setAttribute("data-motion", "ready");
      reveals = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.setAttribute("data-revealed", "");
            reveals?.unobserve(entry.target);
          }),
        { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
      );
      blocks.forEach(
        (block) =>
          block.hasAttribute("data-revealed") || reveals!.observe(block),
      );
    };
    const onPreference = () => {
      arm();
      schedule();
    };

    update();
    arm();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", onPreference);
    return () => {
      cancelAnimationFrame(frame);
      reveals?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", onPreference);
    };
  }, [page]);
}

/**
 * Inertial wheel scrolling for mouse and trackpad users. Native scrolling is
 * kept for touch, keyboard paging and reduced motion. In-page navigation links
 * glide; the skip link keeps its native focus behavior.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const fine = matchMedia("(pointer: fine)");
    const reduced = matchMedia(REDUCED);
    if (!fine.matches || reduced.matches) return;
    let cancelled = false;
    let frame = 0;
    let lenis: import("lenis").default | undefined;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[href^="#"]:not(.lp-skip)',
      );
      const id = link?.getAttribute("href");
      if (!lenis || !id || id.length < 2) return;
      const target = document.getElementById(id.slice(1));
      if (!target) return;
      event.preventDefault();
      // Match native anchor focus while Lenis owns the scroll animation.
      if (target.tabIndex < 0 && !target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        target.addEventListener(
          "blur",
          () => target.removeAttribute("tabindex"),
          {
            once: true,
          },
        );
      }
      target.focus({ preventScroll: true });
      lenis.scrollTo(target, { offset: -12 });
      history.replaceState(null, "", id);
    };
    void import("lenis")
      .then(({ default: Lenis }) => {
        if (cancelled) return;
        lenis = new Lenis({ duration: 1.1, smoothWheel: true });
        const raf = (time: number) => {
          lenis?.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
        document.addEventListener("click", onClick);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("click", onClick);
      lenis?.destroy();
    };
  }, []);
}
