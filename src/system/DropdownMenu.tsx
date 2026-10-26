import * as Primitive from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { useGlide } from "./useGlide";
import { useSystem, usePortalDestination } from "./useSystem";
export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  separatorBefore?: boolean;
  onSelect?: () => void;
}
export interface DropdownMenuProps {
  trigger: ReactElement;
  items: MenuItem[];
  align?: "start" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export function DropdownMenu({
  trigger,
  items,
  align = "start",
  open,
  onOpenChange,
}: DropdownMenuProps) {
  const { config } = useSystem();
  const container = usePortalDestination();
  const [localOpen, setLocalOpen] = useState(false);
  const glide = useGlide();
  function changeOpen(value: boolean) {
    setLocalOpen(value);
    onOpenChange?.(value);
  }
  return (
    <Primitive.Root
      modal={false}
      dir={config.direction}
      open={open ?? localOpen}
      onOpenChange={changeOpen}
    >
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      {container && (
        <Primitive.Portal container={container}>
          <Primitive.Content
            ref={glide}
            className="tz-menu"
            sideOffset={7}
            align={align}
            collisionPadding={12}
            onKeyDown={(event) => {
              if (event.key === "Tab") {
                event.preventDefault();
                changeOpen(false);
              }
            }}
          >
            {items.map((item) => (
              <div key={item.id}>
                {item.separatorBefore && (
                  <Primitive.Separator className="tz-menu-separator" />
                )}
                <Primitive.Item
                  className="tz-menu-item"
                  disabled={item.disabled}
                  data-destructive={item.destructive || undefined}
                  onSelect={item.onSelect}
                  onPointerLeave={(event) => {
                    // Animation/scrolling can move an unfocused item away from a
                    // stationary pointer. Its leave must not clear keyboard focus.
                    if (
                      event.currentTarget !==
                      event.currentTarget.ownerDocument.activeElement
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  {item.icon && <span aria-hidden="true">{item.icon}</span>}
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <kbd className="tz-kbd" dir="ltr">
                      {item.shortcut}
                    </kbd>
                  )}
                </Primitive.Item>
              </div>
            ))}
          </Primitive.Content>
        </Primitive.Portal>
      )}
    </Primitive.Root>
  );
}
