import { useSyncExternalStore } from "react";
import { useSystem } from "./useSystem";
const query = "(prefers-reduced-motion: reduce)";
function snapshot() {
  return typeof window !== "undefined" && !!window.matchMedia?.(query).matches;
}
function subscribe(changed: () => void) {
  const media =
    typeof window !== "undefined" ? window.matchMedia?.(query) : undefined;
  media?.addEventListener("change", changed);
  return () => media?.removeEventListener("change", changed);
}
/** Internal preference for cosmetic timers and SVG motion as well as CSS. */
export function useReducedMotion() {
  const { config } = useSystem();
  const os = useSyncExternalStore(subscribe, snapshot, () => true);
  return config.reducedMotion || os;
}
