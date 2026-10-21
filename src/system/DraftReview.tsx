import { Check, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { FocusEvent, ReactNode } from "react";
import { AIMark } from "./AIMark";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Countdown } from "./Countdown";
import { DecisionBar } from "./DecisionBar";
import type { DecisionAction } from "./DecisionBar";
import { InlineDiff } from "./InlineDiff";
import type { DiffSegment, InlineDiffLabels } from "./InlineDiff";
import { StatusPill } from "./StatusPill";
import type { StatusPillState } from "./StatusPill";
import { Textarea } from "./Textarea";
import { Thread } from "./Thread";
import { Tray } from "./Tray";
import { diffText } from "./diff-text";
import { draftReviewCopy } from "./draft-review-copy";
import { formatElapsed } from "./format";
import { useSystem } from "./useSystem";

export type DraftTone = "friendly" | "brief" | "formal";
type Status = DraftReviewProps["status"];

/** Every built-in string Draft for review shows; `labels` overrides any of them. */
export interface DraftReviewLabels {
  /** The heading when the host gives no `title`: «مسودة للمراجعة». */
  title: string;
  /** The pill's word for each status, agreeing with الرسالة: «أُرسلت». */
  pills: Record<Status, string>;
  /** Name the recipients and the attachments. */
  to: string;
  attachments: string;
  /** Heads a suggested edit, before its own title: «اقتراح المساعد · …». */
  suggestion: string;
  /** Names the message's text area. */
  message: string;
  /** Names the tone group, and each tone in it. */
  tone: string;
  tones: Record<DraftTone, string>;
  discard: string;
  send: string;
  undo: string;
  /** The line while the host holds the message: «تُرسَل خلال ١٠ث». */
  sendingIn: (time: string) => string;
  /** The line once the hold is over, or when there is none. */
  sendingNow: string;
  /** The receipts, which the region also says. */
  sent: string;
  discarded: string;
  /** The region's other sentences, one per change of status. */
  saysWriting: string;
  saysReady: string;
  saysSending: string;
  saysSendingIn: (time: string) => string;
  saysCancelled: string;
  saysSentAfterUndo: string;
  /** Words for the tracked changes inside. */
  inlineDiff?: Partial<InlineDiffLabels>;
}
export interface DraftReviewProps {
  status: "writing" | "ready" | "sending" | "sent" | "discarded";
  /** The heading; «مسودة للمراجعة» / Draft for review by default. */
  title?: ReactNode;
  /** The record the draft is about, framed on the tray under the header. */
  record?: {
    id: string;
    customer: ReactNode;
    amount: ReactNode;
    overdue?: ReactNode;
  };
  recipients: readonly { id: string; label: ReactNode }[];
  attachments?: readonly { id: string; label: ReactNode }[];
  /** The message: the host's growing text while writing, then the draft. */
  body: string;
  /** Makes the body a text area while ready without a suggestion. */
  onBodyChange?: (body: string) => void;
  /** An edit to the body, shown as tracked changes while ready. */
  suggestion?: {
    title?: ReactNode;
    segments: readonly DiffSegment[];
    decisions: Readonly<Record<string, "accepted" | "rejected">>;
    onDecisionsChange: (next: Record<string, "accepted" | "rejected">) => void;
  };
  tone?: DraftTone;
  onToneChange?: (tone: DraftTone) => void;
  /** The text on screen, once per ready status. */
  onSend?: (text: string) => void;
  onDiscard?: () => void;
  /**
   * Whole seconds left in the host's hold before it sends, read when the
   * countdown mounts. Undo shows only with `onUndo`, while they last.
   */
  undoWindow?: number;
  onUndo?: () => void;
  /** The agent that wrote the draft, under the title. */
  agent?: ReactNode;
  /** The heading's level; 3 by default. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<DraftReviewLabels>;
  /** "card" sits on a tray; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
}

const pillStates: Record<Status, StatusPillState> = {
  writing: "running",
  ready: "needs-you",
  sending: "running",
  sent: "completed",
  discarded: "stopped",
};
const tones: readonly DraftTone[] = ["friendly", "brief", "formal"];

function Chips({
  items,
}: {
  items: readonly { id: string; label: ReactNode }[];
}) {
  return (
    <ul role="list" className="tz-draft-review-chips">
      {items.map((item) => (
        <li key={item.id}>
          {/* A name or a file name, each in its own direction. */}
          <bdi>{item.label}</bdi>
        </li>
      ))}
    </ul>
  );
}

/**
 * Draft for review (spec section 13.3): the assistant writes a message for a
 * record, and the person reviews it, edits it and sends it. The host owns the
 * status, the text and the sending. Send hands over the text on screen, once
 * per ready status; Ctrl or Cmd+Enter does the same, 500 ms after the text,
 * the tone, the recipients or the attachments last changed. Undo shows only
 * while the host holds the message, and a receipt says what was sent, never
 * that it came back. One polite region says each change of status once.
 */
export function DraftReview({
  status,
  title,
  record,
  recipients,
  attachments = [],
  body,
  onBodyChange,
  suggestion,
  tone,
  onToneChange,
  onSend,
  onDiscard,
  undoWindow,
  onUndo,
  agent,
  headingLevel = 3,
  labels,
  appearance = "card",
}: DraftReviewProps) {
  const { config } = useSystem(),
    uid = useId();
  const copy: DraftReviewLabels = {
    ...draftReviewCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const root = useRef<HTMLElement>(null),
    live = useRef<HTMLSpanElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    heard = useRef<Status | null>(null),
    // Send or Discard, and Undo, each act once per status, even before the
    // next render.
    decided = useRef(false),
    undone = useRef(false);
  // What the person did in this status, and whether the hold ran out. A new
  // status starts it afresh.
  const [round, setRound] = useState<{
    status: Status;
    chose?: "send" | "discard";
    undid?: boolean;
    ended?: boolean;
  }>({ status });
  if (round.status !== status) setRound({ status });
  const now: typeof round = round.status === status ? round : { status };
  const Heading = `h${headingLevel}` as const;

  // Send hands over what the person sees: the suggestion as decided, else
  // the body. A change to it, the tone, the recipients or the attachments
  // makes Ctrl or Cmd+Enter wait 500 ms again.
  const text = suggestion
    ? diffText(suggestion.segments, suggestion.decisions)
    : body;
  const contentKey = JSON.stringify([
    text,
    tone,
    recipients.map((item) => item.id),
    attachments.map((item) => item.id),
  ]);
  // The host's hold, in whole seconds, so Undo never outlasts it.
  const left = Math.floor(
    Number.isFinite(undoWindow) ? Math.max(0, undoWindow!) : 0,
  );
  const held = status === "sending" && left > 0 && !!onUndo && !now.ended;

  // One polite region, one sentence per change of status. It mounts empty:
  // the status it mounts in is not news. Only the host's next status says
  // what became of an Undo.
  useEffect(() => {
    const was = heard.current;
    if (was === status) return;
    heard.current = status;
    const undid = undone.current;
    decided.current = false;
    undone.current = false;
    if (was === null || !live.current) return;
    live.current.textContent =
      status === "writing"
        ? copy.saysWriting
        : status === "ready"
          ? was === "sending"
            ? copy.saysCancelled
            : copy.saysReady
          : status === "sending"
            ? held
              ? copy.saysSendingIn(formatElapsed(left, config))
              : copy.saysSending
            : status === "sent"
              ? undid
                ? copy.saysSentAfterUndo
                : copy.sent
              : copy.discarded;
  });
  // When a change removes or disables the focused control (Send, Discard,
  // Undo, the text area, a tone), focus moves to the section rather than
  // dropping to the page.
  useLayoutEffect(() => {
    const element = lastFocus.current,
      node = root.current;
    if (!element || !node) return;
    if (element.isConnected && !(element as HTMLButtonElement).disabled) return;
    lastFocus.current = null;
    const active = node.ownerDocument.activeElement;
    if (!active || active === node.ownerDocument.body || active === element)
      node.focus();
  });

  function decide(choice: "send" | "discard") {
    if (decided.current || status !== "ready") return;
    decided.current = true;
    setRound({ status, chose: choice });
    if (choice === "send") onSend?.(text);
    else onDiscard?.();
  }
  function undo() {
    if (undone.current || !onUndo) return;
    undone.current = true;
    setRound((current) => ({ ...current, undid: true }));
    onUndo();
  }

  const header = (
    <div className="tz-draft-review-header" data-zone="header">
      <AIMark working={status === "writing"} />
      <div className="tz-draft-review-heading">
        <Heading id={`${uid}-title`} className="tz-draft-review-title">
          {title ?? copy.title}
        </Heading>
        {agent != null && (
          <span className="tz-draft-review-agent">{agent}</span>
        )}
      </div>
      <StatusPill state={pillStates[status]} label={copy.pills[status]} />
      {record && (
        <p className="tz-draft-review-record">
          {/* A dot comes before each part but the first; see the CSS. Each
              part is a span in the record's direction, the id isolated
              inside its own. */}
          <span className="tz-draft-review-record-parts">
            <span>
              <bdi dir="ltr">{record.id}</bdi>
            </span>
            <span>{record.customer}</span>
            <span className="tz-draft-review-amount">{record.amount}</span>
            {record.overdue != null && (
              <span>
                <Badge tone="error">{record.overdue}</Badge>
              </span>
            )}
          </span>
        </p>
      )}
    </div>
  );

  const locked =
    status === "sending" || status === "sent" || status === "discarded";
  const paper = (
    <>
      <dl className="tz-draft-review-fields">
        <div>
          <dt>{copy.to}</dt>
          <dd>
            <Chips items={recipients} />
          </dd>
        </div>
        {attachments.length > 0 && (
          <div>
            <dt>{copy.attachments}</dt>
            <dd>
              <Chips items={attachments} />
            </dd>
          </div>
        )}
      </dl>
      <div className="tz-draft-review-body">
        {status === "ready" && suggestion ? (
          <>
            <p className="tz-draft-review-label">
              {copy.suggestion}
              {suggestion.title != null && <> · {suggestion.title}</>}
            </p>
            <p className="tz-draft-review-text">
              <InlineDiff
                segments={suggestion.segments}
                decisions={suggestion.decisions}
                onDecisionsChange={suggestion.onDecisionsChange}
                labels={copy.inlineDiff}
              />
            </p>
          </>
        ) : status === "ready" && onBodyChange ? (
          <Textarea
            label={copy.message}
            value={body}
            rows={6}
            onChange={(event) => onBodyChange(event.target.value)}
          />
        ) : (
          <>
            <p className="tz-draft-review-text" dir="auto">
              {text}
            </p>
            {status === "writing" && <Thread state="running" />}
          </>
        )}
      </div>
      {onToneChange && (
        <div
          role="radiogroup"
          aria-labelledby={`${uid}-tone`}
          className="tz-draft-review-tone"
        >
          <span id={`${uid}-tone`} className="tz-draft-review-label">
            {copy.tone}
          </span>
          <div className="tz-draft-review-tones">
            {tones.map((value) => (
              <label key={value} className="tz-draft-review-tone-option">
                <input
                  type="radio"
                  name={`${uid}-tone`}
                  value={value}
                  checked={tone === value}
                  disabled={locked}
                  onChange={() => onToneChange(value)}
                />
                <span>{copy.tones[value]}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );

  // The person's options while ready, with Send last; while sending, the
  // host's hold with Undo; then the receipt. No action shows without its
  // handler.
  const actions: DecisionAction[] =
    status === "ready"
      ? [
          ...(onDiscard
            ? [
                {
                  id: "discard",
                  label: copy.discard,
                  loading: now.chose === "discard",
                  disabled: !!now.chose,
                  onSelect: () => decide("discard"),
                },
              ]
            : []),
          ...(onSend
            ? [
                {
                  id: "send",
                  label: copy.send,
                  tone: "primary" as const,
                  shortcut: "Mod+Enter" as const,
                  loading: now.chose === "send",
                  disabled: !!now.chose,
                  onSelect: () => decide("send"),
                },
              ]
            : []),
        ]
      : [];
  const decision =
    status === "ready" ? (
      (onSend || onDiscard) && (
        <div className="tz-draft-review-decision" data-zone="decision">
          <DecisionBar actions={actions} scope={root} contentKey={contentKey} />
        </div>
      )
    ) : status === "sending" ? (
      <div className="tz-draft-review-decision" data-zone="decision">
        {held ? (
          <>
            {/* The host's window, which a hover or focus never stretches. */}
            <Countdown
              seconds={left}
              onComplete={() =>
                setRound((current) => ({ ...current, ended: true }))
              }
              label={copy.sendingIn}
              announcement="off"
            />
            <Button
              variant="secondary"
              size="sm"
              state={now.undid ? "loading" : "idle"}
              onClick={undo}
            >
              {copy.undo}
            </Button>
          </>
        ) : (
          <p className="tz-draft-review-line">{copy.sendingNow}</p>
        )}
      </div>
    ) : status === "sent" || status === "discarded" ? (
      <p
        className="tz-draft-review-receipt"
        data-zone="decision"
        data-outcome={status}
      >
        {status === "sent" ? (
          <Check size={15} aria-hidden="true" />
        ) : (
          <X size={15} aria-hidden="true" />
        )}
        <span>{status === "sent" ? copy.sent : copy.discarded}</span>
      </p>
    ) : null;

  return (
    <section
      ref={root}
      tabIndex={-1}
      aria-labelledby={`${uid}-title`}
      className="tz-draft-review"
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
        <Tray paper={false} header={header} footer={decision || undefined}>
          <div
            className="tz-tray-paper tz-draft-review-paper"
            data-zone="paper"
          >
            {paper}
          </div>
        </Tray>
      ) : (
        <>
          {header}
          <div className="tz-draft-review-paper" data-zone="paper">
            {paper}
          </div>
          {decision && <div className="tz-draft-review-footer">{decision}</div>}
        </>
      )}
    </section>
  );
}
