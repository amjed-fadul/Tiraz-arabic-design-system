import { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
/** Follow the input's current form, including late/external associations and canceled resets. */
export function useEntryReset(
  inputRef: RefObject<HTMLInputElement | null>,
  reset: () => void,
) {
  const latest = useRef(reset);
  useLayoutEffect(() => {
    latest.current = reset;
  });
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const onReset = (event: Event) => {
      if (event.target !== input.form) return;
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (
          !event.defaultPrevented &&
          input.isConnected &&
          event.target === input.form
        )
          latest.current();
      }, 0);
      timers.add(timer);
    };
    input.ownerDocument.addEventListener("reset", onReset, true);
    return () => {
      input.ownerDocument.removeEventListener("reset", onReset, true);
      for (const timer of timers) clearTimeout(timer);
    };
  }, [inputRef]);
}
