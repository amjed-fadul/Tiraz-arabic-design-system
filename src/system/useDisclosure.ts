import { useLayoutEffect, useRef } from "react";
import type { FocusEvent, RefObject } from "react";

/**
 * TaskRows' disclosure rules for a trigger and its panel (spec §16a, behavior
 * 10). A closed panel is hidden and inert at once. On collapse, focus returns
 * to the trigger only if it was inside the panel and has not moved elsewhere.
 * Spread `panelProps` on the panel and give the trigger `triggerRef`.
 */
export function useDisclosure(open: boolean): {
  triggerRef: RefObject<HTMLButtonElement | null>;
  panelProps: {
    ref: RefObject<HTMLDivElement | null>;
    hidden: boolean;
    inert: boolean;
    "aria-hidden": true | undefined;
    onFocusCapture: (event: FocusEvent<HTMLDivElement>) => void;
    onBlurCapture: (event: FocusEvent<HTMLDivElement>) => void;
  };
} {
  const triggerRef = useRef<HTMLButtonElement | null>(null),
    panelRef = useRef<HTMLDivElement | null>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    previous = useRef(open);
  useLayoutEffect(() => {
    const focused = lastFocus.current,
      doc = panelRef.current?.ownerDocument;
    if (
      previous.current &&
      !open &&
      focused &&
      panelRef.current?.contains(focused) &&
      (doc?.activeElement === focused || doc?.activeElement === doc?.body)
    )
      triggerRef.current?.focus();
    if (!open) lastFocus.current = null;
    previous.current = open;
  }, [open]);
  return {
    triggerRef,
    panelProps: {
      ref: panelRef,
      hidden: !open,
      inert: !open,
      "aria-hidden": open ? undefined : true,
      onFocusCapture: (event) => {
        lastFocus.current = event.target as HTMLElement;
      },
      onBlurCapture: (event) => {
        // A deliberate departure from an open panel is never reclaimed; a blur
        // that closing the panel caused keeps its target.
        if (
          !event.currentTarget.hidden &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          lastFocus.current = null;
      },
    },
  };
}
