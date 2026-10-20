import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, ExternalLink, FileText, Globe } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { sourceHref } from "./source-url";
import { useSystem } from "./useSystem";
import { useChanged } from "./useChanged";
import { numberLocale } from "./config";
import { formatCount } from "./format";

export interface SourceReference {
  /** Unique, stable application ID; not derived from array position. */
  id: string;
  /** Stable application-assigned citation number, retained on reorder/filter. */
  number: number;
  title: string;
  href?: string;
  description?: string;
  metadata?: string;
}
export interface SourcesLabels {
  summary?: (count: number) => string;
  empty?: string;
  unavailable?: string;
}
export interface SourcesProps {
  items: readonly SourceReference[];
  defaultExpanded?: boolean;
  /** Controls the list; pair it with `onExpandedChange`. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Marks this source's row, for the one whose citation is being previewed. */
  highlightedId?: string;
  labels?: SourcesLabels;
  className?: string;
}
export interface InlineCitationLabels {
  source?: (number: number, title: string) => string;
  open?: string;
  unavailable?: string;
}
export interface InlineCitationProps {
  source: SourceReference;
  /** Disclosure uses an interactive popup; link preserves native browser
   * behavior; preview is a link that shows the source on hover or focus (a
   * button, when the source has no safe destination). */
  mode?: "disclosure" | "link" | "preview";
  /** Called when the popup or preview opens or closes. */
  onOpenChange?: (open: boolean) => void;
  labels?: InlineCitationLabels;
  className?: string;
}
function destination(href: string) {
  try {
    const url = new URL(href);
    return url.host;
  } catch {
    return href;
  }
}
export function Sources({
  items,
  defaultExpanded = false,
  expanded,
  onExpandedChange,
  highlightedId,
  labels,
  className = "",
}: SourcesProps) {
  const { config } = useSystem(),
    ar = config.direction === "rtl",
    digits = new Intl.NumberFormat(numberLocale(config), {
      useGrouping: false,
    }),
    id = useId();
  const [local, setLocal] = useState(defaultExpanded);
  const open = expanded ?? local;
  // The list rises in only when it is opened, never when it mounts open.
  const changed = useChanged(open);
  const unavailable =
    labels?.unavailable ?? (ar ? "الرابط غير متاح" : "Destination unavailable");
  if (!items.length)
    return (
      <p className={`tz-sources-empty ${className}`}>
        {labels?.empty ?? (ar ? "لا توجد مصادر" : "No sources supplied")}
      </p>
    );
  // Arabic agrees with the noun: one, the dual, 3–10, then 11 and up.
  const summary =
    labels?.summary?.(items.length) ??
    formatCount(items.length, "source", config);
  return (
    <div
      className={`tz-sources ${className}`}
      data-changed={changed || undefined}
    >
      <button
        type="button"
        className="tz-sources-trigger"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (expanded === undefined) setLocal(!open);
          onExpandedChange?.(!open);
        }}
      >
        <span aria-hidden="true" className="tz-sources-marks">
          {items.slice(0, 3).map((item) => {
            // A web page shows a globe; a document or local file, a page.
            const Icon = /^https?:\/\//i.test(sourceHref(item.href) ?? "")
              ? Globe
              : FileText;
            return (
              <span key={item.id}>
                <Icon size={12} />
              </span>
            );
          })}
        </span>
        <span>{summary}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {/* Hidden rather than removed, so the list can fade out as it closes. */}
      <ol id={id} className="tz-sources-list" hidden={!open}>
        {items.map((source) => {
          const href = sourceHref(source.href);
          const content = (
            <>
              <bdi className="tz-source-number">
                {digits.format(source.number)}
              </bdi>{" "}
              <span className="tz-source-copy">
                <strong dir="auto">{source.title}</strong>{" "}
                {href && (
                  <small>
                    <bdi dir="ltr">{destination(href)}</bdi>
                  </small>
                )}{" "}
                {source.metadata && <small dir="auto">{source.metadata}</small>}
                {!href && <small>{unavailable}</small>}
              </span>
              {href && <ExternalLink size={13} aria-hidden="true" />}
            </>
          );
          return (
            <li
              key={source.id}
              data-source-id={source.id}
              data-highlighted={source.id === highlightedId || undefined}
            >
              {href ? (
                <a href={href} className="tz-source-row">
                  {content}
                </a>
              ) : (
                <div className="tz-source-row">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
// The source's domain, number, title, description and metadata, as the
// disclosure and the preview both show them.
function CitationDetails({
  source,
  href,
  digits,
  unavailable,
  titleId,
}: {
  source: SourceReference;
  href: string | undefined;
  digits: Intl.NumberFormat;
  unavailable: string;
  titleId?: string;
}) {
  return (
    <>
      <div className="tz-citation-domain">
        <bdi dir="ltr">{href ? destination(href) : unavailable}</bdi>
        <bdi>{digits.format(source.number)}</bdi>
      </div>
      <strong id={titleId} dir="auto">
        {source.title}
      </strong>
      {source.description && (
        <blockquote dir="auto">{source.description}</blockquote>
      )}
      {source.metadata && <small dir="auto">{source.metadata}</small>}
    </>
  );
}
// How long the preview waits to close once the pointer leaves, so it can cross
// the gap between the chip and the preview (WCAG 1.4.13, hoverable).
const previewGrace = 120;
/**
 * A chip that shows its source while the pointer is on it or it has focus. A
 * source with a safe destination is a link, so Enter and a click follow it; one
 * without is a button, so Tab still reaches it and a click shows the preview.
 * Escape and blur close the preview, and the pointer moving onto it keeps it
 * open.
 */
function CitationPreview({
  source,
  href,
  name,
  digits,
  unavailable,
  className,
  onOpenChange,
}: {
  source: SourceReference;
  href: string | undefined;
  name: string;
  digits: Intl.NumberFormat;
  unavailable: string;
  className: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const { config, container } = useSystem(),
    previewId = useId();
  const [open, setOpen] = useState(false);
  const anchor = useRef<Element | null>(null),
    shown = useRef(false),
    hovered = useRef(false),
    focused = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function change(next: boolean) {
    clearTimeout(timer.current);
    if (shown.current === next) return;
    shown.current = next;
    setOpen(next);
    onOpenChange?.(next);
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  const enter = (event: ReactPointerEvent) => {
    // A touch has no hover; its tap follows the link or shows the button's.
    if (event.pointerType === "touch") return;
    hovered.current = true;
    change(true);
  };
  const leave = () => {
    hovered.current = false;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!hovered.current && !focused.current) change(false);
    }, previewGrace);
  };
  const shared = {
    ref: (node: Element | null) => {
      anchor.current = node;
    },
    className,
    "aria-label": name,
    "aria-describedby": open ? previewId : undefined,
    "data-source-id": source.id,
    "data-state": open ? "open" : "closed",
    onFocus: () => {
      focused.current = true;
      change(true);
    },
    onBlur: () => {
      focused.current = false;
      if (!hovered.current) change(false);
    },
    onPointerEnter: enter,
    onPointerLeave: leave,
  };
  const number = <bdi>{digits.format(source.number)}</bdi>;
  return (
    <Popover.Root open={open} onOpenChange={change}>
      <Popover.Anchor asChild>
        {href ? (
          <a {...shared} href={href}>
            {number}
          </a>
        ) : (
          <button {...shared} type="button" onClick={() => change(true)}>
            {number}
          </button>
        )}
      </Popover.Anchor>
      <Popover.Portal container={container}>
        <Popover.Content
          className="tz-citation-popup"
          id={previewId}
          role="tooltip"
          dir={config.direction}
          sideOffset={6}
          collisionPadding={12}
          // The preview never takes focus: the chip keeps it.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (anchor.current?.contains(event.target as Node))
              event.preventDefault();
          }}
          onPointerEnter={() => {
            hovered.current = true;
            clearTimeout(timer.current);
          }}
          onPointerLeave={leave}
        >
          <CitationDetails
            source={source}
            href={href}
            digits={digits}
            unavailable={unavailable}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
export function InlineCitation({
  source,
  mode = "disclosure",
  onOpenChange,
  labels,
  className = "",
}: InlineCitationProps) {
  const { config, container } = useSystem(),
    ar = config.direction === "rtl",
    digits = new Intl.NumberFormat(numberLocale(config), {
      useGrouping: false,
    }),
    titleId = useId();
  const href = sourceHref(source.href),
    unavailable =
      labels?.unavailable ??
      (ar ? "الرابط غير متاح" : "Destination unavailable");
  const name =
    labels?.source?.(source.number, source.title) ??
    (ar
      ? `المصدر ${digits.format(source.number)}: ${source.title}`
      : `Source ${digits.format(source.number)}: ${source.title}`);
  const number = <bdi>{digits.format(source.number)}</bdi>;
  const cls = `tz-inline-citation ${className}`;
  if (mode === "preview")
    return (
      <CitationPreview
        source={source}
        href={href}
        name={name}
        digits={digits}
        unavailable={unavailable}
        className={cls}
        onOpenChange={onOpenChange}
      />
    );
  if (mode === "link")
    return href ? (
      <a
        className={cls}
        href={href}
        aria-label={name}
        data-source-id={source.id}
      >
        {number}
      </a>
    ) : (
      <span
        className={cls}
        aria-label={`${name}. ${unavailable}`}
        data-source-id={source.id}
      >
        {number}
      </span>
    );
  return (
    <Popover.Root onOpenChange={onOpenChange}>
      <Popover.Trigger
        className={cls}
        type="button"
        aria-label={name}
        data-source-id={source.id}
      >
        {number}
      </Popover.Trigger>
      <Popover.Portal container={container}>
        <Popover.Content
          className="tz-citation-popup"
          dir={config.direction}
          aria-labelledby={titleId}
          sideOffset={6}
          collisionPadding={12}
        >
          <CitationDetails
            source={source}
            href={href}
            digits={digits}
            unavailable={unavailable}
            titleId={titleId}
          />
          {href && (
            <a href={href}>
              {labels?.open ?? (ar ? "فتح المصدر" : "Open source")}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
