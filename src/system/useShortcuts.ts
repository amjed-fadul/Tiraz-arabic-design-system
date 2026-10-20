import { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

/** The only shortcuts a pattern offers: no plain Enter anywhere (spec section 8). */
export type Shortcut = "Escape" | "Mod+Enter";

/** Apple keyboards name the modifier ⌘ (Cmd); others name it Ctrl. */
export function applePlatform() {
  return (
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(`${navigator.platform} ${navigator.userAgent}`)
  );
}

// A menu, listbox or dialog inside the pattern owns its own keys.
const owners = '[role="menu"], [role="listbox"], [role="dialog"]';

function shortcutOf(event: KeyboardEvent): Shortcut | undefined {
  if (event.altKey || event.shiftKey) return undefined;
  if (event.key === "Escape" && !event.ctrlKey && !event.metaKey)
    return "Escape";
  // Ctrl or Meta, never both, so a chord means exactly one modifier.
  if (event.key === "Enter" && event.ctrlKey !== event.metaKey)
    return "Mod+Enter";
  return undefined;
}

/**
 * Scoped, safe shortcuts (spec section 8): one keydown listener on `scope`.
 * Repeats, composition and keys another handler already took are ignored, and
 * so are keys from a menu, listbox or dialog inside the scope. Mod+Enter waits
 * 500 ms after mount and after `contentKey` changes, so a held or repeated
 * chord never acts on content the person has not seen. A handled key calls
 * preventDefault(), so an enclosing scope skips it; inside a Sheet or Modal,
 * Radix has already taken Escape, so nothing is recorded here.
 */
export function useShortcuts(
  scope: RefObject<HTMLElement | null>,
  handlers: readonly { key: Shortcut; run: () => void; enabled?: boolean }[],
  contentKey?: string,
) {
  const latest = useRef(handlers),
    armedAt = useRef(Infinity);
  useLayoutEffect(() => {
    latest.current = handlers;
  });
  // Set as the content commits, before the browser can deliver another key.
  useLayoutEffect(() => {
    armedAt.current = Date.now() + 500;
  }, [contentKey]);
  useEffect(() => {
    const element = scope.current;
    if (!element) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.keyCode === 229
      )
        return;
      const key = shortcutOf(event);
      if (!key) return;
      const owner = (event.target as Element | null)?.closest?.(owners);
      if (owner && owner !== element && element.contains(owner)) return;
      const handler = latest.current.find(
        (candidate) => candidate.key === key && candidate.enabled !== false,
      );
      if (!handler) return;
      // A chord inside the wait is still this scope's, so it is consumed and
      // an enclosing pattern never acts on it either.
      event.preventDefault();
      if (key === "Mod+Enter" && Date.now() < armedAt.current) return;
      handler.run();
    };
    element.addEventListener("keydown", onKeyDown);
    return () => element.removeEventListener("keydown", onKeyDown);
  }, [scope]);
}
