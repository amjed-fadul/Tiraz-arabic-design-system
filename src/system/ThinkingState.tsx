import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type ThinkingStateProps = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  /** Brief user-facing activity summary, never private model reasoning. */
  label: string;
  /** Execution state belongs to the host. No automatic transitions. */
  active: boolean;
  children: ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  announcement?: "polite" | "off";
};
/** Application-supplied activity details. Only disclosure state can be internal. */
export function ThinkingState({
  label,
  active,
  children,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  announcement = "polite",
  className = "",
  ...props
}: ThinkingStateProps) {
  const uid = useId(),
    titleId = `${uid}-title`,
    panelId = `${uid}-panel`;
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const open = expanded ?? localExpanded;
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null),
    previous = useRef(open);
  // Same focus recovery rule as TaskRows: recover from this panel only, never
  // reclaim a deliberate move elsewhere. The host may replace the focused child
  // in the same commit as collapse, so membership after commit is not required.
  useLayoutEffect(() => {
    const focused = lastFocus.current,
      doc = panel.current?.ownerDocument;
    if (
      previous.current &&
      !open &&
      focused &&
      (doc?.activeElement === focused || doc?.activeElement === doc?.body)
    )
      trigger.current?.focus();
    if (!open) lastFocus.current = null;
    previous.current = open;
  }, [open]);
  return (
    <div
      {...props}
      className={`tz-thinking-state ${className}`}
      data-active={active}
      data-expanded={open}
    >
      <span
        className="tz-visually-hidden"
        role={announcement === "polite" ? "status" : undefined}
        aria-live={announcement === "polite" ? "polite" : "off"}
        aria-atomic="true"
      >
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        className="tz-thinking-state-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (expanded === undefined) setLocalExpanded(!open);
          onExpandedChange?.(!open);
        }}
      >
        <svg
          className="tz-thinking-state-glyph"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8Z" />
        </svg>
        <bdi
          id={titleId}
          key={String(active)}
          className={active ? "tz-ai-shimmer" : "tz-thinking-completed"}
        >
          {label}
        </bdi>
        <ChevronDown className="tz-thinking-state-chevron" aria-hidden="true" />
      </button>
      <div
        ref={panel}
        id={panelId}
        role="region"
        aria-labelledby={titleId}
        hidden={!open}
        inert={!open}
        aria-hidden={!open || undefined}
        className="tz-thinking-state-panel"
        onFocusCapture={(event) => {
          lastFocus.current = event.target as HTMLElement;
        }}
        onBlurCapture={(event) => {
          if (
            !event.currentTarget.hidden &&
            !event.currentTarget.contains(event.relatedTarget)
          )
            lastFocus.current = null;
        }}
      >
        <div className="tz-thinking-state-clip">
          <div className="tz-thinking-state-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
