import * as Primitive from "@radix-ui/react-toast";
import { useId, useRef, useState } from "react";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { ToastContext } from "./useToast";
import type { ToastMessage } from "./useToast";
interface Entry extends ToastMessage {
  id: string;
  open: boolean;
  returnFocus: HTMLElement | null;
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
          return (
            <Primitive.Root
              key={entry.id}
              className="tz-toast"
              data-tone={entry.tone ?? "info"}
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
                  setSession((prev) => ({
                    ...prev,
                    entries: prev.entries.map((item) =>
                      item.id === entry.id ? { ...item, open: false } : item,
                    ),
                  }));
                }
              }}
            >
              <Icon className="tz-toast-icon" aria-hidden="true" size={21} />
              <div>
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
        />
      </Primitive.Provider>
    </ToastContext.Provider>
  );
}
