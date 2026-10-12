import * as Primitive from "@radix-ui/react-toast";
import { useId, useState } from "react";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { ToastContext } from "./useToast";
import type { ToastMessage } from "./useToast";
interface Entry extends ToastMessage {
  id: string;
  open: boolean;
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
  const [entries, setEntries] = useState<Entry[]>([]);
  const uid = useId();
  function toast(message: ToastMessage) {
    setEntries((prev) => [
      ...prev.slice(-2),
      { ...message, id: `${uid}-${crypto.randomUUID()}`, open: true },
    ]);
  }
  return (
    <ToastContext.Provider value={{ toast }}>
      <Primitive.Provider duration={5000} swipeDirection="down" label={label}>
        {children}
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
                if (!open)
                  setEntries((prev) =>
                    prev.map((item) =>
                      item.id === entry.id ? { ...item, open: false } : item,
                    ),
                  );
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
        <Primitive.Viewport className="tz-toast-viewport" label={label} />
      </Primitive.Provider>
    </ToastContext.Provider>
  );
}
