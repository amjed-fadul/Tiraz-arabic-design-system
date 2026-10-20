import { useEffect, useId, useLayoutEffect, useRef } from "react";
import type { FocusEvent, ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { AIMark } from "./AIMark";
import { DecisionBar } from "./DecisionBar";
import type { DecisionAction } from "./DecisionBar";
import { Skeleton } from "./Skeleton";
import { InlineCitation } from "./Sources";
import type { SourceReference } from "./Sources";
import { StatusPill } from "./StatusPill";
import { Tray } from "./Tray";
import { changeSummaryCopy } from "./change-summary-copy";
import { useSystem } from "./useSystem";

/** Every built-in string What changed shows; `labels` overrides any of them. */
export interface ChangeSummaryLabels {
  /** The heading when the host gives no title. */
  title: string;
  /** Under the title while the summary is ready or stale. */
  madeByAssistant: string;
  /** The pill's word while updating and when failed. */
  updatingPill: string;
  failedPill: string;
  /** Each row's hidden direction word, beside its arrow. */
  directions: Record<"up" | "down" | "flat", string>;
  /** Above the reason: «السبب الأرجح». */
  reason: string;
  /** Beside a stale summary, and a failed one. */
  refresh: string;
  retry: string;
  /** The four announcements. Updating, stale and failed also head the footer. */
  updating: string;
  ready: string;
  stale: string;
  failed: string;
}
export interface ChangeSummaryProps {
  title?: ReactNode;
  status: "updating" | "ready" | "stale" | "failed";
  /** The first six show. `direction` says which way, `tone` what it means. */
  rows: readonly {
    id: string;
    metric: string;
    /** The change in words, without a sign: «١٨٪ عن سبتمبر». */
    change: ReactNode;
    direction: "up" | "down" | "flat";
    tone: "good" | "bad" | "neutral";
    /** Points in time order; the sparkline runs left to right in both directions. */
    series?: readonly number[];
  }[];
  /** The most likely reason, with a citation for each of `sources`. */
  reason?: ReactNode;
  sources?: readonly SourceReference[];
  /** The footer's «اعتمادًا على ٣ تقارير» and «حُدّث قبل ٥ د». */
  basedOn?: ReactNode;
  updated?: ReactNode;
  /** Shown while ready: one primary next step, one secondary. */
  actions?: readonly {
    id: string;
    label: string;
    primary?: boolean;
    onSelect(): void;
  }[];
  onRefresh?(): void;
  /** The title's level; 3 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<ChangeSummaryLabels>;
  /** "card" sits on a tray; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
}

const maxRows = 6;
const icons = { up: ArrowUp, down: ArrowDown, flat: Minus };

// The plot is 56 by 20 inside a margin that keeps the line's ends and the
// endpoint whole. Point 0 is at x = 0 and the last at x = 56, whatever the
// page's direction: time runs left to right, as in Tiraz's charts.
const plotWidth = 56,
  plotHeight = 20,
  margin = 3;
function Sparkline({
  series,
  tone,
}: {
  series: readonly number[];
  tone: "good" | "bad" | "neutral";
}) {
  const low = Math.min(...series),
    span = Math.max(...series) - low;
  const points = series.map((value, index) => [
    +((index * plotWidth) / (series.length - 1)).toFixed(1),
    +(
      span === 0
        ? plotHeight / 2
        : plotHeight - ((value - low) / span) * plotHeight
    ).toFixed(1),
  ]);
  const [endX, endY] = points[points.length - 1];
  return (
    <svg
      className="tz-change-summary-spark"
      data-tone={tone}
      viewBox={`${-margin} ${-margin} ${plotWidth + 2 * margin} ${plotHeight + 2 * margin}`}
      width={plotWidth + 2 * margin}
      height={plotHeight + 2 * margin}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={points
          .map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`)
          .join(" ")}
      />
      <circle cx={endX} cy={endY} r={2.5} />
    </svg>
  );
}

/**
 * What changed (spec section 12.8): what moved, why, and what to do next. The
 * host supplies the status, the rows and their tones; each row says which way
 * with an arrow and a hidden word, and what it means with color, so more late
 * invoices is red though it rises. One polite region says each change of
 * status once.
 */
export function ChangeSummary({
  title,
  status,
  rows,
  reason,
  sources,
  basedOn,
  updated,
  actions,
  onRefresh,
  headingLevel = 3,
  labels,
  appearance = "card",
}: ChangeSummaryProps) {
  const { config } = useSystem(),
    uid = useId();
  const copy: ChangeSummaryLabels = {
    ...changeSummaryCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const root = useRef<HTMLElement>(null),
    live = useRef<HTMLSpanElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    heard = useRef<ChangeSummaryProps["status"] | null>(null);
  const Heading = `h${headingLevel}` as const;
  const updating = status === "updating";

  // One polite region, one sentence per change of status. It mounts empty, and
  // the status it mounts in is not news.
  useEffect(() => {
    if (heard.current === null) {
      heard.current = status;
      return;
    }
    if (heard.current === status || !live.current) return;
    heard.current = status;
    live.current.textContent = copy[status];
  });
  // When a change removes the focused control (Refresh), focus moves to the
  // section rather than dropping to the page.
  useLayoutEffect(() => {
    const element = lastFocus.current,
      node = root.current;
    if (!element || !node || element.isConnected) return;
    lastFocus.current = null;
    const active = node.ownerDocument.activeElement;
    if (!active || active === node.ownerDocument.body) node.focus();
  });

  const header = (
    <div className="tz-change-summary-header" data-zone="header">
      <AIMark working={updating} />
      <div className="tz-change-summary-heading">
        <Heading id={`${uid}-title`} className="tz-change-summary-title">
          {title ?? copy.title}
        </Heading>
        {(status === "ready" || status === "stale") && (
          <p className="tz-change-summary-made">{copy.madeByAssistant}</p>
        )}
      </div>
      {updating && <StatusPill state="running" label={copy.updatingPill} />}
      {status === "failed" && (
        <StatusPill state="failed" label={copy.failedPill} />
      )}
    </div>
  );

  const shown = rows.slice(0, maxRows);
  const paper = updating ? (
    // The rows' places, while the numbers are on their way.
    <ul className="tz-change-summary-rows" aria-hidden="true">
      {Array.from({ length: shown.length || 3 }, (_, index) => (
        <li key={index} className="tz-change-summary-row" data-skeleton>
          <Skeleton className="tz-change-summary-skeleton" />
          <Skeleton className="tz-change-summary-skeleton" />
        </li>
      ))}
    </ul>
  ) : (
    <>
      <ul role="list" className="tz-change-summary-rows">
        {shown.map((row) => {
          const Arrow = icons[row.direction];
          return (
            <li key={row.id} className="tz-change-summary-row">
              <div className="tz-change-summary-copy">
                <span className="tz-change-summary-metric">{row.metric}</span>
                <span
                  className="tz-change-summary-badge"
                  data-direction={row.direction}
                  data-tone={row.tone}
                >
                  <Arrow size={14} aria-hidden="true" />
                  <span className="tz-visually-hidden">
                    {copy.directions[row.direction]}
                  </span>
                  <span>{row.change}</span>
                </span>
              </div>
              {!!row.series && row.series.length > 1 && (
                <Sparkline series={row.series} tone={row.tone} />
              )}
            </li>
          );
        })}
      </ul>
      {reason != null && (
        <div className="tz-change-summary-reason">
          <p className="tz-change-summary-reason-label">{copy.reason}</p>
          <div>
            {reason}
            {sources?.map((source) => (
              <InlineCitation key={source.id} source={source} mode="preview" />
            ))}
          </div>
        </div>
      )}
    </>
  );

  const meta = (text: ReactNode) => (
    <span className="tz-change-summary-meta" data-zone="meta">
      {text}
    </span>
  );
  const decide = (list: DecisionAction[]) =>
    list.length > 0 && (
      <div className="tz-change-summary-decision" data-zone="decision">
        <DecisionBar actions={list} scope={root} />
      </div>
    );
  const firstPrimary = actions?.findIndex((action) => action.primary) ?? -1;
  const footer =
    status === "ready" ? (
      <>
        {(basedOn != null || updated != null) &&
          meta(
            <>
              {basedOn}
              {basedOn != null && updated != null && " · "}
              {updated}
            </>,
          )}
        {decide(
          (actions ?? []).map((action, index) => ({
            id: action.id,
            label: action.label,
            tone: index === firstPrimary ? "primary" : "secondary",
            onSelect: () => action.onSelect(),
          })),
        )}
      </>
    ) : status === "stale" ? (
      <>
        {meta(
          <>
            {copy.stale}
            {updated != null && <> · {updated}</>}
          </>,
        )}
        {onRefresh &&
          decide([
            {
              id: "refresh",
              label: copy.refresh,
              tone: "primary",
              onSelect: () => onRefresh(),
            },
          ])}
      </>
    ) : status === "failed" ? (
      <>
        {meta(`${copy.failed}.`)}
        {onRefresh &&
          decide([
            {
              id: "retry",
              label: copy.retry,
              tone: "primary",
              onSelect: () => onRefresh(),
            },
          ])}
      </>
    ) : (
      meta(`${copy.updating}…`)
    );

  return (
    <section
      ref={root}
      tabIndex={-1}
      aria-labelledby={`${uid}-title`}
      className="tz-change-summary"
      data-status={status}
      data-appearance={appearance}
      onFocus={(event) => {
        lastFocus.current = event.target as HTMLElement;
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null))
          return;
        // Focus moved to another control on purpose is never reclaimed. A
        // control that is disabled or removed drops focus to the page.
        if (event.relatedTarget) lastFocus.current = null;
      }}
    >
      <span
        ref={live}
        className="tz-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      {appearance === "card" ? (
        <Tray paper={false} header={header} footer={footer}>
          <div
            className="tz-tray-paper tz-change-summary-paper"
            data-zone="paper"
            aria-busy={updating || undefined}
          >
            {paper}
          </div>
        </Tray>
      ) : (
        <>
          {header}
          <div
            className="tz-change-summary-paper"
            data-zone="paper"
            aria-busy={updating || undefined}
          >
            {paper}
          </div>
          <div className="tz-change-summary-footer">{footer}</div>
        </>
      )}
    </section>
  );
}
