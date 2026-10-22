import { useCallback } from "react";
/**
 * One soft highlight glides behind whichever row matches `selector`, instead
 * of each row repainting on its own. Visual only: focus, selection and
 * keyboard behavior stay with the primitive that sets the attribute.
 */
export function useGlide(selector = "[data-highlighted]") {
  return useCallback(
    (root: HTMLElement | null) => {
      if (!root || typeof MutationObserver === "undefined") return;
      root.setAttribute("data-glide", "");
      let shown = false;
      let frame = 0;
      const update = () => {
        const target = root.querySelector<HTMLElement>(selector);
        if (!target) {
          shown = false;
          root.style.setProperty("--glide-opacity", "0");
          return;
        }
        const jump = !shown;
        // The first highlight appears in place; later ones travel.
        if (jump) root.setAttribute("data-glide-jump", "");
        root.style.setProperty("--glide-y", `${target.offsetTop}px`);
        root.style.setProperty("--glide-h", `${target.offsetHeight}px`);
        root.style.setProperty("--glide-opacity", "1");
        if (target.hasAttribute("data-destructive"))
          root.setAttribute("data-glide-tone", "danger");
        else root.removeAttribute("data-glide-tone");
        shown = true;
        if (jump) {
          void root.offsetHeight;
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() =>
            root.removeAttribute("data-glide-jump"),
          );
        }
      };
      const observer = new MutationObserver(update);
      observer.observe(root, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-highlighted"],
      });
      update();
      return () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      };
    },
    [selector],
  );
}
