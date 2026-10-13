import * as Primitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useSystem } from "./useSystem";

export interface AccordionItem {
  /** Stable, unique, nonempty value. Empty string represents no open item. */
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}
export interface AccordionProps {
  items: readonly AccordionItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  collapsible?: boolean;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}
/** One vertical disclosure open at a time. Keyboard behavior belongs to Radix. */
export function Accordion({
  items,
  value,
  defaultValue,
  onValueChange,
  collapsible = false,
  headingLevel = 3,
  className = "",
}: AccordionProps) {
  const { config } = useSystem();
  const [localValue, setLocalValue] = useState(defaultValue ?? "");
  const active = value === undefined ? localValue : value;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Primitive.Root
      type="single"
      orientation="vertical"
      dir={config.direction}
      value={active}
      onValueChange={(next) => {
        if (value === undefined) setLocalValue(next);
        onValueChange?.(next);
      }}
      collapsible={collapsible}
      className={`tz-accordion ${className}`}
    >
      {items.map((item) => (
        <Primitive.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          className="tz-accordion-item"
        >
          <Primitive.Header asChild>
            <Heading className="tz-accordion-heading">
              <Primitive.Trigger className="tz-accordion-trigger">
                <span>{item.label}</span>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className="tz-accordion-chevron"
                />
              </Primitive.Trigger>
            </Heading>
          </Primitive.Header>
          <Primitive.Content
            className="tz-accordion-panel"
            inert={active !== item.value}
            aria-hidden={active !== item.value || undefined}
          >
            <div className="tz-accordion-content">{item.content}</div>
          </Primitive.Content>
        </Primitive.Item>
      ))}
    </Primitive.Root>
  );
}
