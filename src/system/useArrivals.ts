import { useState } from "react";
/** Items present on mount are settled; anything that arrives later is fresh
 * until its entrance finishes, so a re-keyed row never replays it. */
export function useArrivals(ids: readonly string[]) {
  const [settled, setSettled] = useState(() => new Set(ids));
  return {
    fresh: (id: string) => !settled.has(id),
    settle: (id: string) =>
      setSettled((previous) =>
        previous.has(id) ? previous : new Set(previous).add(id),
      ),
  };
}
