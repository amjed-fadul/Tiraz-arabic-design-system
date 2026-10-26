import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { SystemContext, useSystem, usePortalDestination } from "./useSystem";
export interface SheetProps {
  trigger: ReactElement;
  title: string;
  description: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "right" | "left";
}
export function Sheet({
  trigger,
  title,
  description,
  closeLabel,
  children,
  footer,
  open,
  onOpenChange,
  side,
}: SheetProps) {
  const system = useSystem();
  const { config } = system;
  const container = usePortalDestination();
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const resolvedSide = side ?? (config.direction === "rtl" ? "right" : "left");
  // The same edge in reading terms, so the CSS can place it with logical
  // properties: the right edge is the start in Arabic and the end in English.
  const edge =
    (resolvedSide === "right") === (config.direction === "rtl")
      ? "start"
      : "end";
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      {container && (
        <Primitive.Portal container={container}>
          <Primitive.Overlay className="tz-sheet-backdrop" />
          <Primitive.Content
            ref={setContent}
            className="tz-sheet"
            data-side={resolvedSide}
            data-edge={edge}
            dir={config.direction}
          >
            <SystemContext.Provider
              value={{ ...system, container: content, portalBoundary: content }}
            >
              <header className="tz-sheet-header">
                <div>
                  <Primitive.Title>{title}</Primitive.Title>
                  <Primitive.Description>{description}</Primitive.Description>
                </div>
                <Primitive.Close
                  className="tz-icon-button"
                  aria-label={closeLabel}
                >
                  <X size={18} />
                </Primitive.Close>
              </header>
              <div className="tz-sheet-body">{children}</div>
              {footer && <footer className="tz-sheet-footer">{footer}</footer>}
            </SystemContext.Provider>
          </Primitive.Content>
        </Primitive.Portal>
      )}
    </Primitive.Root>
  );
}
