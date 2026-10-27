import * as Primitive from "@radix-ui/react-tabs";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { useSystem } from "./useSystem";
import { useChanged } from "./useChanged";
export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}
export interface TabsProps {
  items: TabItem[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: "underline" | "segment";
  className?: string;
}
export interface TabsRootProps {
  /** Nonempty accessible name for the tablist. */
  label: string;
  /** Controlled active value; pair with onValueChange. */
  value?: string;
  /** Initial uncontrolled value; defaults to the first enabled trigger. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: "underline" | "segment";
  className?: string;
  children: ReactNode;
}
export interface TabsListProps {
  children: ReactNode;
}
export interface TabsTriggerProps {
  /** Unique, nonempty value shared with its TabsContent. */
  value: string;
  disabled?: boolean;
  /** The visible label. */
  children: ReactNode;
}
export interface TabsContentProps {
  value: string;
  children: ReactNode;
}

const TabsContext = createContext<{
  label: string;
  active: string | undefined;
  claim: (value: string) => void;
} | null>(null);
function useTabs(part: string) {
  const context = useContext(TabsContext);
  if (!context) throw new Error(`${part} requires TabsRoot.`);
  return context;
}

/** Compose one TabsList of triggers and a TabsContent per trigger. */
export function TabsRoot({
  label,
  value,
  defaultValue,
  onValueChange,
  variant = "underline",
  className = "",
  children,
}: TabsRootProps) {
  const { config } = useSystem();
  const [local, setLocal] = useState(defaultValue);
  // Without a value the first enabled trigger claims selection once it mounts.
  const [claimed, setClaimed] = useState<string>();
  const selected = value ?? local;
  const active = selected ?? claimed;
  // Panels animate only after the first switch, never on first render.
  const changed = useChanged(selected);
  // Radix reports one pointer selection twice (on focus, then on mousedown)
  // before React renders it, so a controlled owner would hear it twice.
  const requested = useRef<string>(undefined);
  const claim = useCallback(
    (next: string) => setClaimed((current) => current ?? next),
    [],
  );
  const context = useMemo(
    () => ({ label, active, claim }),
    [label, active, claim],
  );
  return (
    <TabsContext.Provider value={context}>
      <Primitive.Root
        className={`tz-tabs ${className}`}
        // Radix stays controlled before the first trigger claims selection.
        value={active ?? ""}
        onValueChange={(v) => {
          if (requested.current === v) return;
          requested.current = v;
          queueMicrotask(() => {
            requested.current = undefined;
          });
          setLocal(v);
          onValueChange?.(v);
        }}
        dir={config.direction}
        data-variant={variant}
        data-changed={changed || undefined}
      >
        {children}
      </Primitive.Root>
    </TabsContext.Provider>
  );
}

/** The tablist and its sliding indicator; put TabsTrigger children inside. */
export function TabsList({ children }: TabsListProps) {
  const { config } = useSystem();
  const { label, active } = useTabs("TabsList");
  const list = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ width: 0, x: 0 });
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      const tab = el.querySelector<HTMLElement>('[data-state="active"]');
      if (tab) {
        // Use layout coordinates: viewport rectangles include any ancestor's
        // scale or perspective, which would be applied to the indicator twice.
        setIndicator({
          width: tab.offsetWidth,
          x: tab.offsetLeft,
        });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [active, config.density, config.direction, children]);
  return (
    <Primitive.List ref={list} className="tz-tab-list" aria-label={label}>
      <span
        aria-hidden="true"
        className="tz-tab-indicator"
        style={
          {
            "--tab-x": `${indicator.x}px`,
            "--tab-w": indicator.width,
          } as CSSProperties
        }
      />
      {children}
    </Primitive.List>
  );
}

/** A native tab button; its children are the label. */
export function TabsTrigger({ value, disabled, children }: TabsTriggerProps) {
  const { claim } = useTabs("TabsTrigger");
  useLayoutEffect(() => {
    if (!disabled) claim(value);
  }, [claim, disabled, value]);
  return (
    <Primitive.Trigger className="tz-tab" value={value} disabled={disabled}>
      {children}
    </Primitive.Trigger>
  );
}

/** The panel shown while its value is active. */
export function TabsContent({ value, children }: TabsContentProps) {
  useTabs("TabsContent");
  return (
    <Primitive.Content className="tz-tab-panel" value={value}>
      {children}
    </Primitive.Content>
  );
}

/** Original convenience API, rendered through the compound parts. */
export function Tabs({
  items,
  label,
  value,
  defaultValue = items.find((item) => !item.disabled)?.value,
  onValueChange,
  variant = "underline",
  className = "",
}: TabsProps) {
  return (
    <TabsRoot
      label={label}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      variant={variant}
      className={className}
    >
      <TabsList>
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </TabsRoot>
  );
}
