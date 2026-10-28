import * as Primitive from "@radix-ui/react-toast";
import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CircleCheck, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { ToastContext } from "./useToast";
import type { ToastMessage } from "./useToast";
// The one gap between stacked toasts: the lift below adds it, and the viewport
// hands it to the CSS as --toast-gap.
const TOAST_GAP = 8;
interface Entry extends ToastMessage {
  id: string;
  open: boolean;
  returnFocus: HTMLElement | null;
  /** Stack position frozen at close, so the exit starts where it was drawn. */
  settled?: { depth: number; lift: number };
  /** A declarative Toast's owner: asked to close it instead of closing it. */
  request?: () => void;
}
export interface ToastProviderProps {
  children: ReactNode;
  /** Nonempty localized accessible name of each close button. */
  closeLabel: string;
  /** Localized name of the notification viewport. */
  label: string;
}
export interface ToastProps extends ToastMessage {
  /** Shown while true. Pair with onOpenChange and set it to false on request. */
  open: boolean;
  /** Called with false, once per request, when the toast times out or is dismissed. */
  onOpenChange?: (open: boolean) => void;
}

type Stack = Record<string, number>;
// The newest toast sits in front at depth 0; each older one sits one step
// behind and lifts by the heights of those in front of it.
function stackPosition(live: Entry[], heights: Stack, entry: Entry) {
  if (entry.settled) return entry.settled;
  const depth = live.length - 1 - live.indexOf(entry);
  const lift = live
    .slice(live.length - depth)
    .reduce((sum, item) => sum + (heights[item.id] ?? 0) + TOAST_GAP, 0);
  return { depth, lift };
}
// Leave the viewport before its last toast removes Radix's focus/hover resume
// listeners; future messages must expire.
function leaveViewport(viewport: HTMLElement | null, entry: Entry) {
  if (viewport && document.activeElement === viewport) {
    if (entry.returnFocus?.isConnected) entry.returnFocus.focus();
    if (viewport.contains(document.activeElement))
      (document.activeElement as HTMLElement).blur();
  }
}

// What a declarative Toast uses to join the provider's stack.
const ToastHostContext = createContext<{
  show: (message: ToastMessage, request: () => void) => string;
  update: (id: string, message: ToastMessage) => void;
  close: (id: string) => void;
} | null>(null);

export function ToastProvider({
  children,
  closeLabel,
  label,
}: ToastProviderProps) {
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
  const place = (entry: Entry) => stackPosition(live, heights, entry);
  const front = live.at(-1);
  // The latest committed stack, for the stable host below.
  const latest = useRef({ entries, heights });
  useLayoutEffect(() => {
    latest.current = { entries, heights };
  });
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
  const host = useMemo(() => {
    function show(message: ToastMessage, request?: () => void) {
      const returnFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const entry: Entry = {
        ...message,
        id: `${uid}-${crypto.randomUUID()}`,
        open: true,
        returnFocus,
        request,
      };
      setSession((prev) => {
        const active = prev.entries.filter((item) => item.open);
        // Three messages from toast() at most; a declarative Toast stays while
        // its owner keeps it open.
        const dropped = new Set(
          request ? [] : active.filter((item) => !item.request).slice(0, -2),
        );
        return {
          entries: [...active.filter((item) => !dropped.has(item)), entry],
          generation: active.length ? prev.generation : prev.generation + 1,
        };
      });
      return entry.id;
    }
    function update(id: string, message: ToastMessage) {
      setSession((prev) => {
        const entry = prev.entries.find((item) => item.id === id);
        if (
          !entry ||
          (entry.title === message.title &&
            entry.description === message.description &&
            entry.tone === message.tone &&
            entry.duration === message.duration)
        )
          return prev;
        return {
          ...prev,
          entries: prev.entries.map((item) =>
            item.id === id ? { ...item, ...message } : item,
          ),
        };
      });
    }
    function close(id: string) {
      const current = latest.current.entries.find((item) => item.id === id);
      if (current) leaveViewport(viewport.current, current);
      setSession((prev) => {
        const entry = prev.entries.find((item) => item.id === id);
        if (!entry?.open) return prev;
        const settled = stackPosition(
          prev.entries.filter((item) => item.open),
          latest.current.heights,
          entry,
        );
        return {
          ...prev,
          entries: prev.entries.map((item) =>
            item.id === id ? { ...item, open: false, settled } : item,
          ),
        };
      });
    }
    return { show, update, close };
  }, [uid]);
  function toast(message: ToastMessage) {
    host.show(message);
  }
  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastHostContext.Provider value={host}>
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
                  : entry.tone === "warning"
                    ? TriangleAlert
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
                    leaveViewport(viewport.current, entry);
                    // A declarative Toast is closed by its owner, not here.
                    if (entry.request) return entry.request();
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
                "--toast-gap": `${TOAST_GAP}px`,
                "--toast-front-height":
                  front && heights[front.id]
                    ? `${heights[front.id]}px`
                    : "auto",
              } as CSSProperties
            }
          />
        </Primitive.Provider>
      </ToastHostContext.Provider>
    </ToastContext.Provider>
  );
}

/**
 * A toast shown while `open`, with the same UI and announcement as toast().
 * Put it anywhere inside ToastProvider; it renders into the provider's viewport.
 */
export function Toast({
  open,
  onOpenChange,
  title,
  description,
  tone,
  duration,
}: ToastProps): ReactNode {
  const host = useContext(ToastHostContext);
  if (!host) throw new Error("Toast requires ToastProvider.");
  const latest = useRef({
    onOpenChange,
    message: { title, description, tone, duration },
  });
  const shown = useRef<string>(undefined);
  useLayoutEffect(() => {
    latest.current = {
      onOpenChange,
      message: { title, description, tone, duration },
    };
  });
  // A new toast, with a new timer and announcement, each time it opens.
  useLayoutEffect(() => {
    if (!open) return;
    const id = host.show(latest.current.message, () =>
      latest.current.onOpenChange?.(false),
    );
    shown.current = id;
    return () => {
      shown.current = undefined;
      host.close(id);
    };
  }, [open, host]);
  useLayoutEffect(() => {
    if (shown.current)
      host.update(shown.current, { title, description, tone, duration });
  }, [host, title, description, tone, duration]);
  return null;
}
