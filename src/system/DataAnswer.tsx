import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { FocusEvent, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { AIMark } from "./AIMark";
import { AreaChart, BarChart, DonutChart, LineChart } from "./Charts";
import type { CartesianChartProps, DonutChartProps } from "./Charts";
import { DecisionBar } from "./DecisionBar";
import type { DecisionAction } from "./DecisionBar";
import { FeedbackBar } from "./FeedbackBar";
import type { FeedbackBarLabels } from "./FeedbackBar";
import { Markdown } from "./Markdown";
import { SourceChip } from "./SourceChip";
import { InlineCitation } from "./Sources";
import type { SourceReference } from "./Sources";
import { StatusPill } from "./StatusPill";
import type { StatusPillState } from "./StatusPill";
import { ThinkingPanel } from "./ThinkingPanel";
import type { ThinkingPanelLabels, ThinkingPanelProps } from "./ThinkingPanel";
import { Tray } from "./Tray";
import { answerText } from "./answer-text";
import { dataAnswerCopy } from "./data-answer-copy";
import { useDisclosure } from "./useDisclosure";
import { useSystem } from "./useSystem";

/** The chart that answers the question: one of the four chart families, given
 * that family's own props. The host reshapes its data for the type it shows. */
export type DataAnswerChart =
  | { type: "line" | "area" | "bar"; props: CartesianChartProps }
  | { type: "donut"; props: DonutChartProps };

/** Every built-in string Ask your data shows; `labels` overrides any of them. */
export interface DataAnswerLabels {
  /** The four announcements, one sentence each. Failed and empty also head the
   * note on the paper. */
  thinking: string;
  completed: string;
  failed: string;
  empty: string;
  /** The status pill's word beside the question. */
  thinkingPill: string;
  completedPill: string;
  failedPill: string;
  /** Beside a failed answer. */
  retry: string;
  /** The disclosure's name, and the heading of the method in a copied answer. */
  method: string;
  /** The method's terms, and what «التصفية» reads without a filter. */
  range: string;
  filters: string;
  noFilters: string;
  tables: string;
  /** The chart types' group, and each type's name in it. */
  chartType: string;
  chartTypes: Record<DataAnswerChart["type"], string>;
  openTable: string;
  pin: string;
  /** Words for the panel and the bar inside the answer. */
  thinkingPanel?: Partial<ThinkingPanelLabels>;
  feedbackBar?: Partial<FeedbackBarLabels>;
}
export interface DataAnswerProps {
  status: "thinking" | "completed" | "failed" | "empty";
  /** The question, as the section's heading. */
  question: ReactNode;
  /** Drawn by `chart.type`'s family with `chart.props` as given, once completed. */
  chart?: DataAnswerChart;
  /** Markdown, two sentences. A `[n]` marker names the `number` of a source. */
  explanation?: string;
  /** The tables the answer rests on. Cited by number, and listed in the method. */
  sources?: readonly SourceReference[];
  /** How the answer was worked out. Without it there is no «كيف حُسب هذا؟». */
  method?: { range: string; filters?: string };
  /** What the search covered. Seconds, the tables found so far, and the steps. */
  thinking?: {
    elapsed: number;
    searched: readonly SourceReference[];
    steps?: ThinkingPanelProps["steps"];
  };
  /** The types the person can switch between; two or more, with the handler. */
  chartTypes?: readonly DataAnswerChart["type"][];
  onChartTypeChange?: (type: DataAnswerChart["type"]) => void;
  onPin?: () => void;
  onOpenTable?: () => void;
  /** The host copies `text`: the explanation, then «كيف حُسب هذا؟» with its
   * range and filters, then «المصادر» and one numbered line per table. */
  onCopy?: (text: string) => void | Promise<void>;
  onRetry?: () => void;
  /** What went wrong, beside a failed answer. */
  error?: ReactNode;
  /** The question's level; 3 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<DataAnswerLabels>;
  /** Speak status and copy feedback politely, or leave announcements to the host. */
  announcement?: "polite" | "off";
  /** "card" sits on a tray; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
}

function Chart({ chart }: { chart: DataAnswerChart }) {
  if (chart.type === "donut") return <DonutChart {...chart.props} />;
  const Plot =
    chart.type === "line"
      ? LineChart
      : chart.type === "area"
        ? AreaChart
        : BarChart;
  return <Plot {...chart.props} />;
}

/**
 * Ask your data (spec section 13.1): a question answered as a chart, a short
 * explanation and «كيف حُسب هذا؟». The host owns the status and every figure:
 * the pattern draws the chart it is given, never fetches or computes, and
 * reports what the person asks for, including the chart type to show next. One
 * polite region says each change of status once; the panel, the chart and the
 * bar are silent.
 */
export function DataAnswer({
  status,
  question,
  chart,
  explanation,
  sources = [],
  method,
  thinking,
  chartTypes,
  onChartTypeChange,
  onPin,
  onOpenTable,
  onCopy,
  onRetry,
  error,
  headingLevel = 3,
  labels,
  announcement = "polite",
  appearance = "card",
}: DataAnswerProps) {
  const { config } = useSystem(),
    uid = useId();
  const copy: DataAnswerLabels = {
    ...dataAnswerCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const root = useRef<HTMLElement>(null),
    live = useRef<HTMLSpanElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    heard = useRef<DataAnswerProps["status"] | null>(null);
  // The panel is open while thinking and folds when the status leaves it; a new
  // question opens it again and folds the method.
  const [panelOpen, setPanelOpen] = useState(status === "thinking"),
    [methodOpen, setMethodOpen] = useState(false),
    [seen, setSeen] = useState(status);
  if (seen !== status) {
    setSeen(status);
    if (status === "thinking") {
      setPanelOpen(true);
      setMethodOpen(false);
    } else if (seen === "thinking") setPanelOpen(false);
  }
  const { triggerRef, panelProps } = useDisclosure(methodOpen);
  const Heading = `h${headingLevel}` as const;

  // One polite region, one sentence per change of status. It mounts empty, and
  // the status it mounts in is not news.
  useEffect(() => {
    if (announcement === "off") {
      heard.current = status;
      return;
    }
    if (heard.current === null) {
      heard.current = status;
      return;
    }
    if (heard.current === status || !live.current) return;
    heard.current = status;
    live.current.textContent = copy[status];
  });
  // When a change removes the focused control (Try again, Pin, a chart type),
  // focus moves to the section rather than dropping to the page.
  useLayoutEffect(() => {
    const element = lastFocus.current,
      node = root.current;
    if (!element || !node || element.isConnected) return;
    lastFocus.current = null;
    const active = node.ownerDocument.activeElement;
    if (!active || active === node.ownerDocument.body) node.focus();
  });

  const pill: { state: StatusPillState; label: string } =
    status === "thinking"
      ? { state: "running", label: copy.thinkingPill }
      : status === "failed"
        ? { state: "failed", label: copy.failedPill }
        : { state: "completed", label: copy.completedPill };
  const header = (
    <div className="tz-data-answer-header" data-zone="header">
      <AIMark working={status === "thinking"} />
      <Heading id={`${uid}-title`} className="tz-data-answer-title">
        {question}
      </Heading>
      <StatusPill state={pill.state} label={pill.label} />
    </div>
  );

  const cite = (marker: number) => {
    const source = sources.find((item) => item.number === marker);
    return source && <InlineCitation source={source} mode="preview" />;
  };
  const answered = !!chart || !!explanation;
  const paper =
    status === "completed" ? (
      answered && (
        <>
          {chart && (
            <div className="tz-data-answer-chart">
              <Chart chart={chart} />
            </div>
          )}
          {explanation && (
            <div className="tz-data-answer-explanation">
              <Markdown
                text={explanation}
                renderCitation={cite}
                links="strict"
              />
            </div>
          )}
        </>
      )
    ) : status === "empty" ? (
      <p className="tz-data-answer-note" data-tone="empty">
        {copy.empty}
      </p>
    ) : status === "failed" ? (
      <p className="tz-data-answer-note" data-tone="danger">
        <strong>{copy.failed}</strong>
        {error != null && <span> {error}</span>}
      </p>
    ) : null;

  const panel = thinking && (
    <div className="tz-data-answer-evidence">
      <ThinkingPanel
        status={
          status === "thinking"
            ? "running"
            : status === "failed"
              ? "failed"
              : "completed"
        }
        elapsed={thinking.elapsed}
        sources={thinking.searched}
        steps={thinking.steps}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        labels={{ thinking: copy.thinking, ...copy.thinkingPanel }}
        announcement="off"
      />
    </div>
  );
  const detail = (status === "completed" || status === "empty") && method && (
    <div
      className="tz-data-answer-method"
      data-expanded={methodOpen}
      data-zone="evidence"
    >
      <button
        ref={triggerRef}
        type="button"
        className="tz-data-answer-method-trigger"
        aria-expanded={methodOpen}
        aria-controls={`${uid}-method`}
        onClick={() => setMethodOpen(!methodOpen)}
      >
        <span>{copy.method}</span>
        <ChevronDown aria-hidden="true" />
      </button>
      <div
        {...panelProps}
        id={`${uid}-method`}
        className="tz-data-answer-method-panel"
      >
        <div className="tz-data-answer-method-clip">
          <dl className="tz-data-answer-method-list">
            <div>
              <dt>{copy.range}</dt>
              <dd>
                <bdi>{method.range}</bdi>
              </dd>
            </div>
            <div>
              <dt>{copy.filters}</dt>
              <dd>
                <bdi>{method.filters ?? copy.noFilters}</bdi>
              </dd>
            </div>
            {sources.length > 0 && (
              <div>
                <dt>{copy.tables}</dt>
                <dd>
                  <ul role="list" className="tz-data-answer-tables">
                    {sources.map((source) => (
                      <li key={source.id}>
                        <SourceChip source={source} />
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );

  // The person's options: the chart type, then what to do with the answer.
  const completed = status === "completed";
  const types =
    completed && chart && onChartTypeChange && (chartTypes?.length ?? 0) > 1
      ? chartTypes
      : undefined;
  const actions: DecisionAction[] =
    status === "failed"
      ? onRetry
        ? [
            {
              id: "retry",
              label: copy.retry,
              tone: "primary",
              onSelect: () => onRetry(),
            },
          ]
        : []
      : completed
        ? [
            ...(onOpenTable
              ? [
                  {
                    id: "table",
                    label: copy.openTable,
                    onSelect: () => onOpenTable(),
                  },
                ]
              : []),
            ...(onPin
              ? [
                  {
                    id: "pin",
                    label: copy.pin,
                    tone: "primary" as const,
                    onSelect: () => onPin(),
                  },
                ]
              : []),
          ]
        : [];
  const copying = completed && !!onCopy;
  const decision = (types || copying || actions.length > 0) && (
    <div className="tz-data-answer-decision" data-zone="decision">
      {types && chart && (
        <div
          role="radiogroup"
          aria-labelledby={`${uid}-types`}
          className="tz-data-answer-types"
        >
          <span id={`${uid}-types`} className="tz-data-answer-types-label">
            {copy.chartType}
          </span>
          <div className="tz-data-answer-types-options">
            {types.map((type) => (
              <label key={type} className="tz-data-answer-type">
                <input
                  type="radio"
                  name={`${uid}-type`}
                  value={type}
                  checked={chart.type === type}
                  onChange={() => onChartTypeChange?.(type)}
                />
                <span>{copy.chartTypes[type]}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {(copying || actions.length > 0) && (
        <div className="tz-data-answer-actions">
          {copying && (
            <FeedbackBar
              announcement="off"
              onCopyAnnouncement={(message) => {
                if (live.current) live.current.textContent = message;
              }}
              onCopy={() =>
                onCopy?.(
                  answerText(
                    explanation ?? "",
                    sources,
                    config,
                    method && {
                      title: copy.method,
                      lines: [
                        `${copy.range}: ${method.range}`,
                        `${copy.filters}: ${method.filters ?? copy.noFilters}`,
                      ],
                    },
                  ),
                )
              }
              labels={copy.feedbackBar}
            />
          )}
          {actions.length > 0 && <DecisionBar actions={actions} scope={root} />}
        </div>
      )}
    </div>
  );

  return (
    <section
      ref={root}
      tabIndex={-1}
      aria-labelledby={`${uid}-title`}
      className="tz-data-answer"
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
      {announcement === "polite" && (
        <span
          ref={live}
          className="tz-visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />
      )}
      {appearance === "card" ? (
        <Tray paper={false} header={header} footer={decision || undefined}>
          {panel}
          {paper && (
            <div
              className="tz-tray-paper tz-data-answer-paper"
              data-zone="paper"
            >
              {paper}
            </div>
          )}
          {detail}
        </Tray>
      ) : (
        <>
          {header}
          {panel}
          {paper && (
            <div className="tz-data-answer-paper" data-zone="paper">
              {paper}
            </div>
          )}
          {detail}
          {decision && <div className="tz-data-answer-footer">{decision}</div>}
        </>
      )}
    </section>
  );
}
