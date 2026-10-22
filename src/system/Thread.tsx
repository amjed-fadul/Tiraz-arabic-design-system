import { useReducedMotion } from "./useReducedMotion";

/**
 * The stitch line under a working label (Woven spec section 14): dashes travel
 * in the reading direction while the assistant works and close into a solid
 * line when it is done. Under reduced motion it is a still line at 45%.
 */
export function Thread({ state }: { state: "running" | "completed" }) {
  const reduced = useReducedMotion();
  return (
    <span
      className="tz-thread"
      data-state={state}
      data-still={reduced || undefined}
      aria-hidden="true"
    />
  );
}
