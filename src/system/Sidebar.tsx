import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { useSystem } from "./useSystem";
import { Tick } from "./Tick";

const SidebarContext = createContext({
  collapsed: false,
  setCollapsed: (_value: boolean) => {},
});
export interface SidebarProps extends ComponentPropsWithRef<"aside"> {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}
/** A navigation surface, not an application shell. Position it in the host layout. */
export function Sidebar({
  collapsed: controlled,
  defaultCollapsed = false,
  onCollapsedChange,
  className = "",
  onFocusCapture,
  ref,
  ...props
}: SidebarProps) {
  const { config } = useSystem();
  const [internal, setInternal] = useState(defaultCollapsed);
  const collapsed = controlled ?? internal;
  const root = useRef<HTMLElement | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const previous = useRef(collapsed);
  useLayoutEffect(() => {
    if (collapsed && !previous.current) {
      const focused = lastFocus.current;
      const hidden = focused?.closest(
        "[data-sidebar-panel], [data-sidebar-label]",
      );
      const doc = root.current?.ownerDocument;
      if (
        hidden &&
        root.current?.contains(focused) &&
        (doc?.activeElement === focused || doc?.activeElement === doc?.body)
      ) {
        const parent = hidden
          .closest("[data-sidebar-disclosure]")
          ?.querySelector<HTMLButtonElement>(
            "[data-sidebar-disclosure-trigger]",
          );
        (
          parent ??
          root.current.querySelector<HTMLElement>(
            "[data-sidebar-toggle], [data-sidebar-item]",
          )
        )?.focus();
      }
    }
    previous.current = collapsed;
  }, [collapsed]);
  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed(value) {
          if (controlled === undefined) setInternal(value);
          if (value !== collapsed) onCollapsedChange?.(value);
        },
      }}
    >
      <aside
        {...props}
        dir={props.dir ?? config.direction}
        className={`tz-sidebar ${className}`}
        data-collapsed={collapsed}
        ref={(node) => {
          root.current = node;
          if (typeof ref === "function") return ref(node);
          if (ref) ref.current = node;
        }}
        onFocusCapture={(event) => {
          lastFocus.current = event.target as HTMLElement;
          onFocusCapture?.(event);
        }}
      />
    </SidebarContext.Provider>
  );
}
export function SidebarHeader({
  className = "",
  ...props
}: ComponentPropsWithRef<"div">) {
  return <div {...props} className={`tz-sidebar-header ${className}`} />;
}
/** Compose an icon/avatar and SidebarLabel without retaining rail text spacing. */
export function SidebarIdentity({
  className = "",
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      data-sidebar-identity=""
      className={`tz-sidebar-identity ${className}`}
    />
  );
}
export function SidebarContent({
  className = "",
  ...props
}: ComponentPropsWithRef<"nav">) {
  return <nav {...props} className={`tz-sidebar-content ${className}`} />;
}
export function SidebarFooter({
  className = "",
  ...props
}: ComponentPropsWithRef<"div">) {
  return <div {...props} className={`tz-sidebar-footer ${className}`} />;
}
/** Wrap branding/account text that should disappear in the rail. No essential actions here. */
export function SidebarLabel({
  className = "",
  ...props
}: ComponentPropsWithRef<"span">) {
  const { collapsed } = useContext(SidebarContext);
  return (
    <span
      {...props}
      className={`tz-sidebar-label ${className}`}
      data-sidebar-label=""
      inert={collapsed || props.inert}
      aria-hidden={collapsed || props["aria-hidden"]}
    />
  );
}
export interface SidebarGroupProps extends ComponentPropsWithRef<"div"> {
  heading?: string;
}
export function SidebarGroup({
  heading,
  className = "",
  children,
  ...props
}: SidebarGroupProps) {
  const id = useId();
  const { collapsed } = useContext(SidebarContext);
  return (
    <div
      {...props}
      className={`tz-sidebar-group ${className}`}
      role={props.role ?? "group"}
      aria-labelledby={
        props["aria-labelledby"] ?? (heading && !collapsed ? id : undefined)
      }
    >
      {heading && (
        <SidebarLabel id={id} className="tz-sidebar-heading">
          {heading}
        </SidebarLabel>
      )}
      {children}
    </div>
  );
}
interface ItemContent {
  label: string;
  icon: ReactNode;
  count?: string | number;
}
function contents({ label, icon, count }: ItemContent) {
  return (
    <>
      <span className="tz-sidebar-icon" aria-hidden="true">
        {icon}
      </span>
      <SidebarLabel>{label}</SidebarLabel>
      {count !== undefined && (
        <span
          className="tz-sidebar-count"
          aria-hidden="true"
          title={String(count)}
        >
          <Tick value={count} />
        </span>
      )}
    </>
  );
}
export interface SidebarItemProps
  extends Omit<ComponentPropsWithRef<"a">, "children">, ItemContent {
  active?: boolean;
}
export function SidebarItem({
  label,
  icon,
  count,
  active = false,
  className = "",
  ...props
}: SidebarItemProps) {
  const { collapsed } = useContext(SidebarContext);
  const link = (
    <a
      {...props}
      className={`tz-sidebar-item ${className}`}
      data-sidebar-item=""
      data-active={active}
      aria-current={active ? "page" : props["aria-current"]}
      aria-label={props["aria-label"] ?? label}
    >
      {contents({ label, icon, count })}
    </a>
  );
  return <Tooltip trigger={link} content={collapsed ? label : ""} />;
}
export interface SidebarActionProps
  extends Omit<ComponentPropsWithRef<"button">, "children">, ItemContent {}
export function SidebarAction({
  label,
  icon,
  count,
  className = "",
  type = "button",
  ...props
}: SidebarActionProps) {
  const { collapsed } = useContext(SidebarContext);
  const button = (
    <button
      {...props}
      type={type}
      className={`tz-sidebar-item ${className}`}
      data-sidebar-item=""
      aria-label={props["aria-label"] ?? label}
    >
      {contents({ label, icon, count })}
    </button>
  );
  return <Tooltip trigger={button} content={collapsed ? label : ""} />;
}
export interface SidebarToggleProps extends ComponentPropsWithRef<"button"> {
  collapseLabel: string;
  expandLabel: string;
}
export function SidebarToggle({
  collapseLabel,
  expandLabel,
  onClick,
  className = "",
  type = "button",
  ...props
}: SidebarToggleProps) {
  const { collapsed, setCollapsed } = useContext(SidebarContext);
  const label = collapsed ? expandLabel : collapseLabel;
  return (
    <Tooltip
      content={label}
      trigger={
        <button
          {...props}
          type={type}
          className={`tz-sidebar-toggle ${className}`}
          data-sidebar-toggle=""
          aria-label={label}
          aria-expanded={!collapsed}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) setCollapsed(!collapsed);
          }}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={18} aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
export interface SidebarDisclosureProps
  extends Omit<ComponentPropsWithRef<"button">, "children">, ItemContent {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Caller supplies whether a descendant is the current destination. */
  activeChild?: boolean;
}
export function SidebarDisclosure({
  label,
  icon,
  count,
  children,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  activeChild = false,
  onClick,
  className = "",
  type = "button",
  ...props
}: SidebarDisclosureProps) {
  const { collapsed, setCollapsed } = useContext(SidebarContext);
  const [internal, setInternal] = useState(defaultOpen);
  const open = controlled ?? internal;
  const shown = open && !collapsed;
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const previous = useRef(shown);
  useLayoutEffect(() => {
    const focused = lastFocus.current;
    const doc = wrapper.current?.ownerDocument;
    if (
      !shown &&
      previous.current &&
      focused?.closest("[data-sidebar-panel]") &&
      (doc?.activeElement === focused || doc?.activeElement === doc?.body)
    )
      wrapper.current
        ?.querySelector<HTMLButtonElement>("[data-sidebar-disclosure-trigger]")
        ?.focus();
    previous.current = shown;
  }, [shown]);
  const button = (
    <button
      {...props}
      type={type}
      className={`tz-sidebar-item ${className}`}
      data-sidebar-item=""
      data-sidebar-disclosure-trigger=""
      data-active={activeChild}
      aria-label={props["aria-label"] ?? label}
      aria-expanded={shown}
      aria-controls={id}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        const next = collapsed ? true : !open;
        if (collapsed) setCollapsed(false);
        if (controlled === undefined) setInternal(next);
        if (next !== open) onOpenChange?.(next);
      }}
    >
      {contents({ label, icon, count })}
      <ChevronDown
        size={14}
        className="tz-sidebar-chevron"
        aria-hidden="true"
      />
    </button>
  );
  return (
    <div
      ref={wrapper}
      data-sidebar-disclosure=""
      onFocusCapture={(event) => {
        lastFocus.current = event.target as HTMLElement;
      }}
    >
      <Tooltip trigger={button} content={collapsed ? label : ""} />
      <div
        id={id}
        data-sidebar-panel=""
        className="tz-sidebar-nested"
        hidden={!shown}
        inert={!shown}
      >
        {children}
      </div>
    </div>
  );
}
