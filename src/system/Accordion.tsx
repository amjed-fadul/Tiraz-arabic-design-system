import * as Primitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { createContext, useContext, useMemo, useState } from "react";
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
export interface AccordionRootProps {
  /** Controlled open section; empty string means none. Pair with onValueChange. */
  value?: string;
  /** Initial uncontrolled section; omission starts closed. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  collapsible?: boolean;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: ReactNode;
}
export interface AccordionSectionProps {
  /** Stable, unique, nonempty value. */
  value: string;
  disabled?: boolean;
  /** Compose one AccordionTrigger and one AccordionContent. */
  children: ReactNode;
}
export interface AccordionTriggerProps {
  /** The visible label; keep nested controls out of it. */
  children: ReactNode;
}
export interface AccordionContentProps {
  children: ReactNode;
}

const RootContext = createContext<{
  active: string;
  headingLevel: 2 | 3 | 4 | 5 | 6;
} | null>(null);
const SectionContext = createContext<{ value: string } | null>(null);
function useRoot(part: string) {
  const context = useContext(RootContext);
  if (!context) throw new Error(`${part} requires AccordionRoot.`);
  return context;
}
function useSection(part: string) {
  const context = useContext(SectionContext);
  if (!context) throw new Error(`${part} requires AccordionSection.`);
  return context;
}

/** One vertical disclosure open at a time. Keyboard behavior belongs to Radix. */
export function AccordionRoot({
  value,
  defaultValue,
  onValueChange,
  collapsible = false,
  headingLevel = 3,
  className = "",
  children,
}: AccordionRootProps) {
  const { config } = useSystem();
  const [localValue, setLocalValue] = useState(defaultValue ?? "");
  const active = value === undefined ? localValue : value;
  const context = useMemo(
    () => ({ active, headingLevel }),
    [active, headingLevel],
  );
  return (
    <RootContext.Provider value={context}>
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
        {children}
      </Primitive.Root>
    </RootContext.Provider>
  );
}

/** One disclosure: an AccordionTrigger and its AccordionContent. */
export function AccordionSection({
  value,
  disabled,
  children,
}: AccordionSectionProps) {
  useRoot("AccordionSection");
  const context = useMemo(() => ({ value }), [value]);
  return (
    <SectionContext.Provider value={context}>
      <Primitive.Item
        value={value}
        disabled={disabled}
        className="tz-accordion-item"
      >
        {children}
      </Primitive.Item>
    </SectionContext.Provider>
  );
}

/** The heading and its button; children are the label. */
export function AccordionTrigger({ children }: AccordionTriggerProps) {
  const { headingLevel } = useRoot("AccordionTrigger");
  useSection("AccordionTrigger");
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Primitive.Header asChild>
      <Heading className="tz-accordion-heading">
        <Primitive.Trigger className="tz-accordion-trigger">
          <span>{children}</span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="tz-accordion-chevron"
          />
        </Primitive.Trigger>
      </Heading>
    </Primitive.Header>
  );
}

/** The panel; closed panels are inert and hidden from assistive technology. */
export function AccordionContent({ children }: AccordionContentProps) {
  const { active } = useRoot("AccordionContent");
  const { value } = useSection("AccordionContent");
  return (
    <Primitive.Content
      className="tz-accordion-panel"
      inert={active !== value}
      aria-hidden={active !== value || undefined}
    >
      <div className="tz-accordion-content">{children}</div>
    </Primitive.Content>
  );
}

/** Original convenience API, rendered through the compound parts. */
export function Accordion({
  items,
  value,
  defaultValue,
  onValueChange,
  collapsible = false,
  headingLevel = 3,
  className = "",
}: AccordionProps) {
  return (
    <AccordionRoot
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      collapsible={collapsible}
      headingLevel={headingLevel}
      className={className}
    >
      {items.map((item) => (
        <AccordionSection
          key={item.value}
          value={item.value}
          disabled={item.disabled}
        >
          <AccordionTrigger>{item.label}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionSection>
      ))}
    </AccordionRoot>
  );
}
