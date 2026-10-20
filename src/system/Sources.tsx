import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, ExternalLink, FileText, Globe } from "lucide-react";
import { useId, useState } from "react";
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
  /** Disclosure uses an interactive popup; link preserves native browser behavior. */
  mode?: "disclosure" | "link";
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
  labels,
  className = "",
}: SourcesProps) {
  const { config } = useSystem(),
    ar = config.direction === "rtl",
    digits = new Intl.NumberFormat(numberLocale(config), {
      useGrouping: false,
    }),
    id = useId();
  const [expanded, setExpanded] = useState(defaultExpanded);
  // The list rises in only when it is opened, never when it mounts open.
  const changed = useChanged(expanded);
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
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(!expanded)}
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
      <ol id={id} className="tz-sources-list" hidden={!expanded}>
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
            <li key={source.id} data-source-id={source.id}>
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
export function InlineCitation({
  source,
  mode = "disclosure",
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
    <Popover.Root>
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
