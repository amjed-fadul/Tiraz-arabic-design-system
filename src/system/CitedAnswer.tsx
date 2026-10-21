import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { FocusEvent, ReactNode } from "react";
import { DecisionBar } from "./DecisionBar";
import type { DecisionAction } from "./DecisionBar";
import { FeedbackBar } from "./FeedbackBar";
import type { FeedbackBarLabels, FeedbackBarProps } from "./FeedbackBar";
import { FollowUps } from "./FollowUps";
import { Markdown } from "./Markdown";
import { InlineCitation, Sources } from "./Sources";
import type { SourceReference } from "./Sources";
import { StreamingText } from "./StreamingText";
import { ThinkingPanel } from "./ThinkingPanel";
import type { ThinkingPanelLabels, ThinkingPanelProps } from "./ThinkingPanel";
import { Tray } from "./Tray";
import { answerText } from "./answer-text";
import { citedAnswerCopy } from "./cited-answer-copy";
import { formatCount, formatElapsed } from "./format";
import { useSystem } from "./useSystem";

/** Every built-in string Cited answer shows; `labels` overrides any of them. */
export interface CitedAnswerLabels {
  /** The section's name when there is no question. */
  title: string;
  /** The five announcements, one sentence each. Failed and stopped also head
   * the note beside the partial answer. */
  thinking: string;
  writing: string;
  completed: string;
  failed: string;
  stopped: string;
  stop: string;
  /** Beside a failed answer. */
  retry: string;
  /** Beside a stopped answer. */
  regenerate: string;
  /** The follow-ups' name. */
  followUps: string;
  /** Words for the panel and the bar inside the answer. */
  thinkingPanel?: Partial<ThinkingPanelLabels>;
  feedbackBar?: Partial<FeedbackBarLabels>;
}
export interface CitedAnswerProps {
  status: "thinking" | "writing" | "completed" | "failed" | "stopped";
  /** The question, as the section's heading. Leave it out when a conversation
   * already shows it. */
  question?: ReactNode;
  /** Markdown, with `[n]` markers that name a source's `number`. */
  content: string;
  /** The sources the answer cites. */
  sources: readonly SourceReference[];
  /** What the search covered. Seconds, the sources found so far, and the steps. */
  thinking?: {
    elapsed: number;
    searched: readonly SourceReference[];
    steps?: ThinkingPanelProps["steps"];
  };
  /** Controls the thinking panel; pair it with `onThinkingOpenChange`. Without
   * it the panel is open while thinking and folds when writing starts. */
  thinkingOpen?: boolean;
  onThinkingOpenChange?: (open: boolean) => void;
  followUps?: readonly { id: string; label: string }[];
  onFollowUp?: (id: string) => void;
  feedback?: "up" | "down" | null;
  reason?: FeedbackBarProps["reason"];
  onFeedbackChange?: FeedbackBarProps["onFeedbackChange"];
  /** The host copies `text`, the answer as written followed by «المصادر» and
   * one numbered line per source, with its link where it is safe; «نُسخت» shows
   * once the promise resolves. A host that ignores the text keeps working. */
  onCopy?: (text: string) => void | Promise<void>;
  onRegenerate?: () => void;
  onStop?: () => void;
  onRetry?: () => void;
  /** Seconds the answer took; shown with the sources' count. */
  duration?: number;
  /** What went wrong, beside a failed answer. */
  error?: ReactNode;
  /** The question's level; 3 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<CitedAnswerLabels>;
  /** "card" sits on a tray; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
}

/**
 * Cited answer (spec section 12.2): an answer with where each claim came from.
 * The host owns the status and the text; the pattern shows the thinking, the
 * answer with its citation chips, the follow-ups, the rating and the meta, and
 * reports what the person asks for. One polite region says each change of
 * status once; the panel, the streamed words and the bar are silent.
 */
export function CitedAnswer({
  status,
  question,
  content,
  sources,
  thinking,
  thinkingOpen,
  onThinkingOpenChange,
  followUps,
  onFollowUp,
  feedback,
  reason,
  onFeedbackChange,
  onCopy,
  onRegenerate,
  onStop,
  onRetry,
  duration,
  error,
  headingLevel = 3,
  labels,
  appearance = "card",
}: CitedAnswerProps) {
  const { config } = useSystem(),
    uid = useId();
  const copy: CitedAnswerLabels = {
    ...citedAnswerCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const root = useRef<HTMLElement>(null),
    live = useRef<HTMLSpanElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    heard = useRef<CitedAnswerProps["status"] | null>(null);
  // The panel is open while thinking and folds when the answer starts, unless
  // the host holds it; a source's row is marked while its preview is open.
  const [localOpen, setLocalOpen] = useState(status === "thinking"),
    [seen, setSeen] = useState(status),
    [highlighted, setHighlighted] = useState<string>();
  if (seen !== status) {
    setSeen(status);
    setHighlighted(undefined);
    if (status === "thinking") setLocalOpen(true);
    else if (seen === "thinking") setLocalOpen(false);
  }
  const Heading = `h${headingLevel}` as const;

  // One polite region, one sentence per change of status, never the answer. It
  // mounts empty, and the status it mounts in is not news.
  useEffect(() => {
    if (heard.current === null) {
      heard.current = status;
      return;
    }
    if (heard.current === status || !live.current) return;
    heard.current = status;
    live.current.textContent = copy[status];
  });
  // When a change removes the focused control (Stop, Try again, Regenerate),
  // focus moves to the section rather than dropping to the page.
  useLayoutEffect(() => {
    const element = lastFocus.current,
      node = root.current;
    if (!element || !node || element.isConnected) return;
    lastFocus.current = null;
    const active = node.ownerDocument.activeElement;
    if (!active || active === node.ownerDocument.body) node.focus();
  });

  const cite = (marker: number) => {
    const source = sources.find((item) => item.number === marker);
    if (!source) return undefined;
    return (
      <InlineCitation
        source={source}
        mode="preview"
        onOpenChange={(open) =>
          setHighlighted((current) =>
            open ? source.id : current === source.id ? undefined : current,
          )
        }
      />
    );
  };
  // A search the person stopped, or that failed, before a word was written says
  // so; once the answer began, the search was done.
  const cutShort =
    (status === "stopped" || status === "failed") && !content.trim();
  const panel = thinking && (
    <ThinkingPanel
      status={
        status === "thinking" ? "running" : cutShort ? status : "completed"
      }
      elapsed={thinking.elapsed}
      sources={thinking.searched}
      steps={thinking.steps}
      open={thinkingOpen ?? localOpen}
      onOpenChange={(open) => {
        if (thinkingOpen === undefined) setLocalOpen(open);
        onThinkingOpenChange?.(open);
      }}
      labels={{ thinking: copy.thinking, ...copy.thinkingPanel }}
      announcement="off"
    />
  );
  const answer =
    status === "thinking" ? null : status === "completed" ? (
      <Markdown text={content} renderCitation={cite} links="strict" />
    ) : (
      <StreamingText
        text={content}
        state={status === "writing" ? "streaming" : status}
        markdown
        statusLabel=""
        announcement="off"
        renderCitation={cite}
        links="strict"
      />
    );
  const paper = status !== "thinking" && (
    <>
      <div className="tz-cited-answer-answer">{answer}</div>
      {status === "failed" && (
        <p className="tz-cited-answer-note" data-tone="danger">
          <strong>{copy.failed}</strong>
          {error != null && <span> {error}</span>}
        </p>
      )}
      {status === "stopped" && (
        <p className="tz-cited-answer-note">{copy.stopped}</p>
      )}
      {status === "completed" && !!followUps?.length && onFollowUp && (
        <FollowUps
          items={followUps}
          onSelect={onFollowUp}
          label={copy.followUps}
        />
      )}
    </>
  );

  const decide = (actions: DecisionAction[]) => (
    <div className="tz-cited-answer-decision" data-zone="decision">
      <DecisionBar actions={actions} scope={root} />
    </div>
  );
  const decision =
    status === "thinking" || status === "writing"
      ? onStop &&
        decide([{ id: "stop", label: copy.stop, onSelect: () => onStop() }])
      : status === "failed"
        ? onRetry &&
          decide([
            {
              id: "retry",
              label: copy.retry,
              tone: "primary",
              onSelect: () => onRetry(),
            },
          ])
        : status === "stopped"
          ? onRegenerate &&
            decide([
              {
                id: "regenerate",
                label: copy.regenerate,
                tone: "primary",
                onSelect: () => onRegenerate(),
              },
            ])
          : (onCopy || onRegenerate || onFeedbackChange) && (
              <div className="tz-cited-answer-decision" data-zone="decision">
                <FeedbackBar
                  feedback={feedback}
                  reason={reason}
                  onFeedbackChange={onFeedbackChange}
                  onCopy={
                    onCopy &&
                    (() => onCopy(answerText(content, sources, config)))
                  }
                  onRegenerate={onRegenerate}
                  labels={{
                    regenerate: copy.regenerate,
                    ...copy.feedbackBar,
                  }}
                />
              </div>
            );
  // The sources' count is the trigger of their list, beside the time it took.
  const meta = sources.length > 0 && (
    <span className="tz-cited-answer-meta" data-zone="meta">
      <Sources
        items={sources}
        highlightedId={highlighted}
        labels={{
          summary: (count) =>
            [
              formatCount(count, "source", config),
              duration === undefined
                ? ""
                : formatElapsed(duration, config, { fractionDigits: 1 }),
            ]
              .filter(Boolean)
              .join(" · "),
        }}
      />
    </span>
  );
  const footer = (meta || decision) && (
    <>
      {meta}
      {decision}
    </>
  );

  const heading = (
    <Heading
      id={`${uid}-title`}
      className={
        question != null ? "tz-cited-answer-question" : "tz-visually-hidden"
      }
      data-zone="header"
    >
      {question ?? copy.title}
    </Heading>
  );

  return (
    <section
      ref={root}
      tabIndex={-1}
      aria-labelledby={`${uid}-title`}
      className="tz-cited-answer"
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
      {heading}
      {appearance === "card" ? (
        <Tray
          paper={false}
          header={panel || undefined}
          footer={footer || undefined}
        >
          {paper && (
            <div
              className="tz-tray-paper tz-cited-answer-paper"
              data-zone="paper"
            >
              {paper}
            </div>
          )}
        </Tray>
      ) : (
        <>
          {panel}
          {paper && (
            <div className="tz-cited-answer-paper" data-zone="paper">
              {paper}
            </div>
          )}
          {footer && <div className="tz-cited-answer-footer">{footer}</div>}
        </>
      )}
    </section>
  );
}
