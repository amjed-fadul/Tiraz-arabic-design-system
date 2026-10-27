import * as Primitive from "@radix-ui/react-dropdown-menu";
import { createContext, useContext, useState } from "react";
import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
import { isBounded } from "./collision-boundary";
import type { CollisionBoundary } from "./collision-boundary";
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
export interface DropdownMenuRootProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export type DropdownMenuTriggerProps = ComponentPropsWithRef<"button"> & {
  asChild?: boolean;
};
export interface DropdownMenuContentProps {
  children: ReactNode;
  align?: "start" | "end";
  collisionBoundary?: CollisionBoundary;
}
export interface DropdownMenuItemProps {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  shortcut?: string;
  icon?: ReactNode;
}

// The root keeps the open state itself so that Tab, handled in the content,
// is requested through the same path as every other change.
const MenuState = createContext<((open: boolean) => void) | null>(null);

/** Compose one trigger and one content per root. */
export function DropdownMenuRoot({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
}: DropdownMenuRootProps) {
  const { config } = useSystem();
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  function changeOpen(value: boolean) {
    setLocalOpen(value);
    onOpenChange?.(value);
  }
  return (
    <MenuState.Provider value={changeOpen}>
      <Primitive.Root
        modal={false}
        dir={config.direction}
        open={open ?? localOpen}
        onOpenChange={changeOpen}
      >
        {children}
      </Primitive.Root>
    </MenuState.Provider>
  );
}

/** A native button, or with asChild the one focusable child. */
export function DropdownMenuTrigger({
  asChild,
  ...props
}: DropdownMenuTriggerProps) {
  return <Primitive.Trigger asChild={asChild} {...props} />;
}

export function DropdownMenuContent({
  children,
  align = "start",
  collisionBoundary,
}: DropdownMenuContentProps) {
  const container = usePortalDestination();
  const glide = useGlide();
  const changeOpen = useContext(MenuState);
  if (!changeOpen)
    throw new Error("DropdownMenuContent requires DropdownMenuRoot.");
  if (!container) return null;
  return (
    <Primitive.Portal container={container}>
      <Primitive.Content
        ref={glide}
        className="tz-menu"
        sideOffset={7}
        align={align}
        collisionBoundary={collisionBoundary}
        collisionPadding={12}
        data-bounded={isBounded(collisionBoundary) || undefined}
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            changeOpen(false);
          }
        }}
      >
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function DropdownMenuItem({
  children,
  onSelect,
  disabled,
  destructive,
  shortcut,
  icon,
}: DropdownMenuItemProps) {
  return (
    <Primitive.Item
      className="tz-menu-item"
      disabled={disabled}
      data-destructive={destructive || undefined}
      onSelect={onSelect}
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
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {shortcut && (
        <kbd className="tz-kbd" dir="ltr">
          {shortcut}
        </kbd>
      )}
    </Primitive.Item>
  );
}

export function DropdownMenuSeparator() {
  return <Primitive.Separator className="tz-menu-separator" />;
}

/** Original convenience API, rendered through the compound parts. */
export function DropdownMenu({
  trigger,
  items,
  align = "start",
  open,
  onOpenChange,
}: DropdownMenuProps) {
  return (
    <DropdownMenuRoot open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {items.map((item) => (
          <div key={item.id}>
            {item.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={item.disabled}
              destructive={item.destructive}
              shortcut={item.shortcut}
              icon={item.icon}
              onSelect={item.onSelect}
            >
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}
