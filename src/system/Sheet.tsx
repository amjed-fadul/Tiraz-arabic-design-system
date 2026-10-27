import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
import { SystemContext, useSystem, usePortalDestination } from "./useSystem";
export interface SheetRootProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export type SheetTriggerProps = ComponentPropsWithRef<"button"> & {
  asChild?: boolean;
};
export interface SheetContentProps {
  title: string;
  description: string;
  closeLabel: string;
  children: ReactNode;
  side?: "right" | "left";
}
export interface SheetBodyProps {
  children: ReactNode;
}
export interface SheetFooterProps {
  children: ReactNode;
}
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

/** Compose one trigger and one content per root. */
export function SheetRoot({ children, ...options }: SheetRootProps) {
  return <Primitive.Root {...options}>{children}</Primitive.Root>;
}

/** A native button, or with asChild the one focusable child. */
export function SheetTrigger({ asChild, ...props }: SheetTriggerProps) {
  return <Primitive.Trigger asChild={asChild} {...props} />;
}

/** Overlay, panel and header; compose SheetBody and SheetFooter. */
export function SheetContent({
  title,
  description,
  closeLabel,
  children,
  side,
}: SheetContentProps) {
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
  if (!container) return null;
  return (
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
            <Primitive.Close className="tz-icon-button" aria-label={closeLabel}>
              <X size={18} />
            </Primitive.Close>
          </header>
          {children}
        </SystemContext.Provider>
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function SheetBody({ children }: SheetBodyProps) {
  return <div className="tz-sheet-body">{children}</div>;
}

export function SheetFooter({ children }: SheetFooterProps) {
  return <footer className="tz-sheet-footer">{children}</footer>;
}

/** Original convenience API, rendered through the compound parts. */
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
  return (
    <SheetRoot open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        title={title}
        description={description}
        closeLabel={closeLabel}
        side={side}
      >
        <SheetBody>{children}</SheetBody>
        {footer && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </SheetRoot>
  );
}
