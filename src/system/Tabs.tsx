import * as Primitive from "@radix-ui/react-tabs";
import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useSystem } from "./useSystem";
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
export function Tabs({
  items,
  label,
  value,
  defaultValue = items.find((item) => !item.disabled)?.value,
  onValueChange,
  variant = "underline",
  className = "",
}: TabsProps) {
  const { config } = useSystem();
  const [local, setLocal] = useState(defaultValue);
  const active = value ?? local;
  // Panels animate only after the first switch, never on first render.
  const [initial] = useState(active);
  const [changed, setChanged] = useState(false);
  if (!changed && active !== initial) setChanged(true);
  const list = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ width: 0, x: 0 });
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      const tab = el.querySelector<HTMLElement>('[data-state="active"]');
      if (tab) {
        const rect = tab.getBoundingClientRect();
        const parent = el.getBoundingClientRect();
        setIndicator({
          width: rect.width,
          x: rect.left - parent.left + el.scrollLeft,
        });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [active, config.density, config.direction, items]);
  return (
    <Primitive.Root
      className={`tz-tabs ${className}`}
      value={active}
      onValueChange={(v) => {
        setLocal(v);
        onValueChange?.(v);
      }}
      dir={config.direction}
      data-variant={variant}
      data-changed={changed || undefined}
    >
      <Primitive.List ref={list} className="tz-tab-list" aria-label={label}>
        <span
          aria-hidden="true"
          className="tz-tab-indicator"
          style={
            {
              width: indicator.width,
              transform: `translateX(${indicator.x}px)`,
            } as CSSProperties
          }
        />
        {items.map((item) => (
          <Primitive.Trigger
            key={item.value}
            className="tz-tab"
            value={item.value}
            disabled={item.disabled}
          >
            {item.label}
          </Primitive.Trigger>
        ))}
      </Primitive.List>
      {items.map((item) => (
        <Primitive.Content
          className="tz-tab-panel"
          key={item.value}
          value={item.value}
        >
          {item.content}
        </Primitive.Content>
      ))}
    </Primitive.Root>
  );
}
