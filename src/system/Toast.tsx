import * as Primitive from "@radix-ui/react-toast";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { ToastContext } from "./useToast";
import type { ToastMessage } from "./useToast";
const TOAST_GAP = 8;
interface Entry extends ToastMessage {
  id: string;
  open: boolean;
  returnFocus: HTMLElement | null;
  /** Stack position frozen at close, so the exit starts where it was drawn. */
  settled?: { depth: number; lift: number };
}
export function ToastProvider({
  children,
  closeLabel,
  label,
}: {
  children: ReactNode;
  closeLabel: string;
  label: string;
}) {
  const [{ entries, generation }, setSession] = useState({
    entries: [] as Entry[],
    generation: 0,
  });
  const uid = useId();
  const viewport = useRef<HTMLOListElement>(null);
  // Stack geometry: the newest toast sits in front at depth 0; each older one
  // sits one step behind and lifts by the heights of those in front of it.
  const [heights, setHeights] = useState<Record<string, number>>({});
  const live = entries.filter((entry) => entry.open);
  const place = (entry: Entry) => {
    if (entry.settled) return entry.settled;
    const depth = live.length - 1 - live.indexOf(entry);
    const lift = live
      .slice(live.length - depth)
      .reduce((sum, item) => sum + (heights[item.id] ?? 0) + TOAST_GAP, 0);
    return { depth, lift };
  };
  const front = live.at(-1);
  useLayoutEffect(() => {
    const list = viewport.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const next: Record<string, number> = {};
      list
        .querySelectorAll<HTMLElement>(".tz-toast[data-toast-id]")
        .forEach((toast) => {
          // Full content height, even while a collapsed toast is clipped.
          next[toast.dataset.toastId!] =
            toast.scrollHeight + toast.offsetHeight - toast.clientHeight;
        });
      setHeights((prev) =>
        Object.keys(next).length === Object.keys(prev).length &&
        Object.entries(next).every(([id, height]) => prev[id] === height)
          ? prev
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    list
      .querySelectorAll(".tz-toast-copy")
      .forEach((copy) => observer.observe(copy));
    return () => observer.disconnect();
  }, [entries]);
  function toast(message: ToastMessage) {
    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const entry: Entry = {
      ...message,
      id: `${uid}-${crypto.randomUUID()}`,
      open: true,
      returnFocus,
    };
    setSession((prev) => {
      const active = prev.entries.filter((item) => item.open);
      return {
        entries: [...active.slice(-2), entry],
        generation: active.length ? prev.generation : prev.generation + 1,
      };
    });
  }
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Reset Radix's pause state for a new batch without remounting callers. */}
      <Primitive.Provider
        key={generation}
        duration={5000}
        swipeDirection="down"
        label={label}
      >
        {entries.map((entry) => {
          const Icon =
            entry.tone === "error"
              ? CircleAlert
              : entry.tone === "success"
                ? CircleCheck
                : Info;
          const { depth, lift } = place(entry);
          return (
            <Primitive.Root
              key={entry.id}
              className="tz-toast"
              data-tone={entry.tone ?? "info"}
              data-toast-id={entry.id}
              data-depth={depth}
              style={
                {
                  "--toast-depth": depth,
                  "--toast-lift": `${lift}px`,
                  "--toast-height": heights[entry.id]
                    ? `${heights[entry.id]}px`
                    : "auto",
                } as CSSProperties
              }
              open={entry.open}
              duration={entry.duration}
              onOpenChange={(open) => {
                if (!open) {
                  // Leave the viewport before its last toast removes Radix's
                  // focus/hover resume listeners; future messages must expire.
                  if (
                    viewport.current &&
                    document.activeElement === viewport.current
                  ) {
                    if (entry.returnFocus?.isConnected)
                      entry.returnFocus.focus();
                    if (viewport.current.contains(document.activeElement))
                      (document.activeElement as HTMLElement).blur();
                  }
                  const settled = place(entry);
                  setSession((prev) => ({
                    ...prev,
                    entries: prev.entries.map((item) =>
                      item.id === entry.id
                        ? { ...item, open: false, settled }
                        : item,
                    ),
                  }));
                }
              }}
            >
              <Icon className="tz-toast-icon" aria-hidden="true" size={20} />
              <div className="tz-toast-copy">
                <Primitive.Title className="tz-toast-title">
                  {entry.title}
                </Primitive.Title>
                {entry.description && (
                  <Primitive.Description className="tz-toast-description">
                    {entry.description}
                  </Primitive.Description>
                )}
              </div>
              <Primitive.Close
                className="tz-icon-button"
                aria-label={closeLabel}
              >
                <X size={16} />
              </Primitive.Close>
            </Primitive.Root>
          );
        })}
        <Primitive.Viewport
          ref={viewport}
          className="tz-toast-viewport"
          label={label}
          style={
            {
              "--toast-front-height":
                front && heights[front.id] ? `${heights[front.id]}px` : "auto",
            } as CSSProperties
          }
        />
      </Primitive.Provider>
    </ToastContext.Provider>
  );
}
