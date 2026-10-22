import * as Dialog from "@radix-ui/react-dialog";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { Button, useSystem } from "../system";
import type { ReactElement, ReactNode } from "react";
import type { Language } from "./i18n";
import { label } from "./i18n";
export function DocsDrawer({
  trigger,
  title,
  children,
  open,
  onOpenChange,
  onClosed,
  language,
  portalContainer,
}: {
  trigger: ReactElement;
  title: string;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed?: () => boolean;
  language: Language;
  portalContainer?: HTMLElement | null;
}) {
  const { container, config } = useSystem();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal container={portalContainer ?? container}>
        <Dialog.Overlay className="docs-drawer-backdrop" />
        <Dialog.Content
          className="docs-drawer"
          data-side={config.direction === "rtl" ? "right" : "left"}
          dir={config.direction}
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            if (onClosed?.()) event.preventDefault();
          }}
        >
          <header>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                aria-label={label("close", language)}
              >
                <XIcon size={20} weight="regular" aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </header>
          <div className="docs-drawer-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
