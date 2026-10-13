import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import type { ReactElement, ReactNode, RefObject } from "react";
import { SystemContext, useSystem } from "./useSystem";
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
  const { container, config } = useSystem();
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
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
          <SystemContext.Provider value={{ config, container: content }}>
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
              <div className="tz-modal-body">{children}</div>
              {footer && <footer className="tz-modal-footer">{footer}</footer>}
            </div>
          </SystemContext.Provider>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
