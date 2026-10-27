import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import type {
  ComponentPropsWithRef,
  ReactElement,
  ReactNode,
  RefObject,
} from "react";
import { SystemContext, useSystem, usePortalDestination } from "./useSystem";
export interface ModalRootProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export type ModalTriggerProps = ComponentPropsWithRef<"button"> & {
  asChild?: boolean;
};
export interface ModalContentProps {
  title: string;
  description: string;
  closeLabel: string;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
}
export interface ModalBodyProps {
  children: ReactNode;
}
export interface ModalFooterProps {
  children: ReactNode;
}
export interface ModalProps {
  trigger: ReactElement;
  title: string;
  description: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/** Compose one trigger and one content per root. */
export function ModalRoot({ children, ...options }: ModalRootProps) {
  return <Primitive.Root {...options}>{children}</Primitive.Root>;
}

/** A native button, or with asChild the one focusable child. */
export function ModalTrigger({ asChild, ...props }: ModalTriggerProps) {
  return <Primitive.Trigger asChild={asChild} {...props} />;
}

/** Overlay, dialog, header and scroll area; compose ModalBody and ModalFooter. */
export function ModalContent({
  title,
  description,
  closeLabel,
  children,
  initialFocusRef,
}: ModalContentProps) {
  const system = useSystem();
  const { config } = system;
  const container = usePortalDestination();
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  if (!container) return null;
  return (
    <Primitive.Portal container={container}>
      <Primitive.Overlay className="tz-sheet-backdrop tz-modal-backdrop" />
      <Primitive.Content
        ref={setContent}
        className="tz-modal"
        dir={config.direction}
        onOpenAutoFocus={(event) => {
          const target = initialFocusRef?.current;
          if (target && content?.contains(target)) {
            target.focus();
            if (target.ownerDocument.activeElement === target)
              event.preventDefault();
          }
        }}
      >
        <SystemContext.Provider
          value={{ ...system, container: content, portalBoundary: content }}
        >
          <div className="tz-modal-scroll">
            <header className="tz-modal-header">
              <div>
                <Primitive.Title>{title}</Primitive.Title>
                <Primitive.Description>{description}</Primitive.Description>
              </div>
              <Primitive.Close
                className="tz-icon-button"
                aria-label={closeLabel}
              >
                <X size={18} aria-hidden="true" />
              </Primitive.Close>
            </header>
            {children}
          </div>
        </SystemContext.Provider>
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function ModalBody({ children }: ModalBodyProps) {
  return <div className="tz-modal-body">{children}</div>;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return <footer className="tz-modal-footer">{children}</footer>;
}

/** Original convenience API, rendered through the compound parts. */
export function Modal({
  trigger,
  title,
  description,
  closeLabel,
  children,
  footer,
  open,
  onOpenChange,
  initialFocusRef,
}: ModalProps) {
  return (
    <ModalRoot open={open} onOpenChange={onOpenChange}>
      <ModalTrigger asChild>{trigger}</ModalTrigger>
      <ModalContent
        title={title}
        description={description}
        closeLabel={closeLabel}
        initialFocusRef={initialFocusRef}
      >
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </ModalRoot>
  );
}
