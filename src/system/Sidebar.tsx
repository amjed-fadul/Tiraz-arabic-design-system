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
import { sidebarIcons } from "./sidebar-icons";
import type { SidebarIconName } from "./sidebar-icons";
import { Tooltip } from "./Tooltip";
import { useSystem } from "./useSystem";
import { Tick } from "./Tick";
import { numberLocale } from "./config";

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
  count?: string | number;
}
/** Exactly one of the two: an icon node, or a name from `sidebarIconNames`. */
type ItemIcon =
  | { icon: ReactNode; iconName?: never }
  | { icon?: never; iconName: SidebarIconName };
/** The icon to draw. `icon` may still be an explicit `null` for none. */
function itemIcon(
  part: string,
  props: { icon?: ReactNode; iconName?: SidebarIconName | null },
): ReactNode {
  const { icon, iconName } = props;
  if (iconName == null) {
    if (!("icon" in props))
      throw new Error(`${part} needs an icon or an iconName.`);
    return icon;
  }
  if (icon !== undefined)
    throw new Error(`${part}: pass icon or iconName, not both.`);
  if (!Object.hasOwn(sidebarIcons, iconName))
    throw new Error(
      `${part}: unknown iconName "${iconName}". Use one of sidebarIconNames.`,
    );
  const Icon = sidebarIcons[iconName];
  return <Icon size={18} />;
}
/** Numeric counts follow the system numerals; string counts are shown as supplied. */
function SidebarCount({ count }: { count: string | number }) {
  const { config } = useSystem();
  const text =
    typeof count === "number"
      ? new Intl.NumberFormat(numberLocale(config), {
          useGrouping: false,
        }).format(count)
      : count;
  return (
    <span className="tz-sidebar-count" aria-hidden="true" title={text}>
      <Tick value={count}>{text}</Tick>
    </span>
  );
}
function contents({ label, icon, count }: ItemContent & { icon: ReactNode }) {
  return (
    <>
      <span className="tz-sidebar-icon" aria-hidden="true">
        {icon}
      </span>
      <SidebarLabel>{label}</SidebarLabel>
      {count !== undefined && <SidebarCount count={count} />}
    </>
  );
}
export type SidebarItemProps = Omit<ComponentPropsWithRef<"a">, "children"> &
  ItemContent &
  ItemIcon & {
    active?: boolean;
  };
export function SidebarItem(item: SidebarItemProps) {
  const {
    label,
    icon: _icon,
    iconName: _iconName,
    count,
    active = false,
    className = "",
    ...props
  } = item;
  const icon = itemIcon("SidebarItem", item);
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
export type SidebarActionProps = Omit<
  ComponentPropsWithRef<"button">,
  "children"
> &
  ItemContent &
  ItemIcon;
export function SidebarAction(action: SidebarActionProps) {
  const {
    label,
    icon: _icon,
    iconName: _iconName,
    count,
    className = "",
    type = "button",
    ...props
  } = action;
  const icon = itemIcon("SidebarAction", action);
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
export type SidebarDisclosureProps = Omit<
  ComponentPropsWithRef<"button">,
  "children"
> &
  ItemContent &
  ItemIcon & {
    children: ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Caller supplies whether a descendant is the current destination. */
    activeChild?: boolean;
  };
export function SidebarDisclosure(disclosure: SidebarDisclosureProps) {
  const {
    label,
    icon: _icon,
    iconName: _iconName,
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
  } = disclosure;
  const icon = itemIcon("SidebarDisclosure", disclosure);
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
