import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { highlightCode } from "./code-highlight";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { StatusIcon } from "./StatusIcon";
import { useToolLabels } from "./useToolLabels";
import type { ToolLabels } from "./useToolLabels";

export type ToolCallState =
  "pending" | "running" | "needs-you" | "completed" | "failed";
export type ToolCallProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  label: string;
  tool: string;
  state: ToolCallState;
  /** Optional decorative glyph for the kind of tool (search, file, database…). */
  icon?: ReactNode;
  /** Preformatted text or application-rendered content. No serialization/execution. */
  input?: ReactNode;
  output?: ReactNode;
  error?: ReactNode;
  /** Formatted, host-supplied duration; no internal clock. */
  duration?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onRetry?: () => void;
  retryLabel?: string;
  announcement?: "polite" | "off";
  /** "card" draws its own surface; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
  /** Replaces any state or section word. */
  labels?: Partial<ToolLabels>;
  /** The level of the input, output and error headings; 4 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
};
function isJson(text: string) {
  const trimmed = text.trim();
  if (!/^[[{]/.test(trimmed)) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}
function Detail({
  label,
  level,
  children,
  error = false,
}: {
  label: string;
  level: 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  error?: boolean;
}) {
  const Heading = `h${level}` as const;
  return (
    <section className="tz-tool-detail" data-error={error || undefined}>
      <Heading>{label}</Heading>
      <div
        className="tz-tool-output"
        dir="auto"
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        {typeof children !== "string" ? (
          children
        ) : error ? (
          // A failure message is prose for people, not program output.
          <p className="tz-tool-message" dir="auto">
            {children}
          </p>
        ) : (
          <pre dir="auto">
            <code>
              {isJson(children) ? highlightCode(children, "json") : children}
            </code>
          </pre>
        )}
      </div>
    </section>
  );
}
/** One application-owned operation. Only disclosure state may be internal. */
export function ToolCall({
  label,
  tool,
  state,
  icon,
  input,
  output,
  error,
  duration,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onRetry,
  retryLabel,
  announcement = "polite",
  appearance = "card",
  labels: overrides,
  headingLevel = 4,
  className = "",
  ...props
}: ToolCallProps) {
  const uid = useId(),
    titleId = `${uid}-title`,
    panelId = `${uid}-panel`;
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const open = expanded ?? localExpanded;
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null),
    previous = useRef(open);
  const labels = useToolLabels(overrides);
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
      className={`tz-tool-call ${className}`}
      data-state={state}
      data-appearance={appearance}
      data-expanded={open}
    >
      <span
        className="tz-visually-hidden"
        role={announcement === "polite" ? "status" : undefined}
        aria-live={announcement}
        aria-atomic="true"
      >
        {label}: {labels[state]}
      </span>
      <button
        ref={trigger}
        type="button"
        className="tz-tool-call-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (expanded === undefined) setLocalExpanded(!open);
          onExpandedChange?.(!open);
        }}
      >
        <StatusIcon state={state} tone="ai" />
        {icon && (
          <span className="tz-tool-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <bdi className="tz-tool-call-label" id={titleId}>
          {label}
        </bdi>
        <Badge className="tz-tool-name">
          <bdi>{tool}</bdi>
        </Badge>
        <span className="tz-tool-call-meta">
          <span className="tz-visually-hidden">{labels[state]}</span>
          {duration ? (
            <bdi>{duration}</bdi>
          ) : (
            <span aria-hidden="true">
              {state === "running" ? labels.running : null}
            </span>
          )}
        </span>
        <ChevronDown className="tz-tool-chevron" aria-hidden="true" />
      </button>
      <div
        ref={panel}
        id={panelId}
        role="region"
        aria-labelledby={titleId}
        className="tz-tool-call-panel"
        hidden={!open}
        inert={!open}
        aria-hidden={!open || undefined}
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
        <div className="tz-tool-call-clip">
          <div className="tz-tool-call-content">
            {input != null && (
              <Detail label={labels.input} level={headingLevel}>
                {input}
              </Detail>
            )}
            {state === "failed" && error != null ? (
              <Detail label={labels.error} level={headingLevel} error>
                {error}
              </Detail>
            ) : (
              output != null && (
                <Detail label={labels.output} level={headingLevel}>
                  {output}
                </Detail>
              )
            )}
            {state === "failed" && onRetry && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  trigger.current?.focus();
                  onRetry();
                }}
              >
                <RotateCcw size={14} aria-hidden="true" />
                {retryLabel ?? labels.retry}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
