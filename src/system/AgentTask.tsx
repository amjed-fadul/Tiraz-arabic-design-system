import { agentPresentationStyle } from "./agent-presentation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, ReactNode, RefObject } from "react";
import { AgentAvatar, AgentHeaderActions } from "./AgentPresentation";
import type { AgentPresentation } from "./AgentPresentation";
import { ApprovalCard } from "./ApprovalCard";
import type {
  ApprovalCardProps,
  ApprovalDetails,
  ApprovalRequest,
} from "./ApprovalCard";
import { Countdown } from "./Countdown";
import { DecisionBar } from "./DecisionBar";
import type { DecisionAction } from "./DecisionBar";
import { Input } from "./Input";
import { Kbd } from "./Kbd";
import { StatusIcon } from "./StatusIcon";
import { StatusPill } from "./StatusPill";
import type { StatusPillState } from "./StatusPill";
import { ToolCall } from "./ToolCall";
import type { ToolCallProps } from "./ToolCall";
import { Tray } from "./Tray";
import { agentTaskCopy } from "./agent-task-copy";
import { numberLocale } from "./config";
import { formatCount, formatElapsed } from "./format";
import { useDisclosure } from "./useDisclosure";
import { applePlatform } from "./useShortcuts";
import { useSystem } from "./useSystem";

export interface AgentStep {
  /** Unique and stable. */
  id: string;
  title: string;
  /** One quiet line under the title, such as «٢١٧ فاتورة · ٣ فروقات». */
  detail?: ReactNode;
  /** The agent the step was handed to; its request names it as who asks. */
  agent?: ReactNode;
  state:
    | "planned"
    | "pending"
    | "running"
    | "completed"
    | "needs-you"
    | "failed"
    | "skipped";
  /** Seconds; a running step's is live, updated at most once a second. */
  duration?: number;
  /** A finished step's operations, listed under its details. */
  tools?: readonly Pick<
    ToolCallProps,
    "label" | "tool" | "state" | "input" | "output" | "error" | "duration"
  >[];
  /** Steering notes for this step; `applied` once the agent picked one up. */
  notes?: readonly { id: string; text: string; applied: boolean }[];
  /** Shown inline as a plain ApprovalCard while the step needs you. */
  request?: ApprovalRequest;
  /** What the inline card shows beyond its request (Decision 4). */
  approval?: ApprovalDetails;
  /** A failed step's error, with the ways forward the host offers. */
  error?: {
    title: ReactNode;
    body?: ReactNode;
    actions?: readonly ("retry" | "skip" | "reconnect")[];
  };
}

/** Every built-in string Agent task shows; `labels` overrides any of them. */
export interface AgentTaskLabels {
  /** The pill in each status, agreeing with المهمة. */
  plan: string;
  running: string;
  needsYou: string;
  failed: string;
  stopped: string;
  completed: string;
  /** Announced as «{title}: يحتاج قرارك». */
  needsDecision: string;
  /** Announced once the task completes. */
  done: string;
  /** Each step's hidden state word, beside its icon. */
  stepStates: Record<AgentStep["state"], string>;
  /** A skipped step's line. */
  skipped: string;
  /** The countdown's sentence around the time left. */
  autoStart: (time: string) => string;
  editPlan: string;
  start: string;
  /** The steering field's name and placeholder. */
  steer: string;
  steerNext: string;
  steerNow: string;
  stop: string;
  /** After a steering note the agent picked up. */
  pickedUp: string;
  /** After a note not picked up yet, and once the task ended without it. */
  waitingNote: string;
  notUsed: string;
  /** A queued note's buttons; each name is the visible word and the note. */
  applyNow: string;
  remove: string;
  applyNoteNow: (text: string) => string;
  removeNote: (text: string) => string;
  /** Announced once a note is sent, and once the agent picks one up. */
  queuedNext: (text: string) => string;
  queuedNow: (text: string) => string;
  pickedUpNote: (text: string) => string;
  /** Before the agent a step was handed to. */
  handedTo: string;
  details: string;
  hideDetails: string;
  retry: string;
  skip: string;
  reconnect: string;
  /** The footers; `step` is the position, in the reader's digits. */
  waiting: (step: string) => string;
  failedAt: (step: string) => string;
  stoppedAt: (step: string) => string;
  /** Above the output chips once the task completes. */
  outputs: string;
  /** Replace the shared count helper's «٥ خطوات» and «١٢ عملية». */
  stepCount?: (count: number) => string;
  operationCount?: (count: number) => string;
}

export interface AgentTaskProps {
  /** Optional avatar, name, identity controls and tray color in the existing header. */
  agentPresentation?: AgentPresentation;
  title: ReactNode;
  agent?: ReactNode;
  status: "plan" | "running" | "needs-you" | "failed" | "stopped" | "completed";
  steps: readonly AgentStep[];
  /** Seconds, shown in the pill while running and once done; never announced. */
  elapsed?: number;
  outputs?: readonly {
    id: string;
    label: ReactNode;
    icon?: ReactNode;
    onOpen?(): void;
  }[];
  /** Seconds before a proposed plan starts on its own; it calls `onStart`. */
  autoStartAfter?: number;
  onStart?(): void;
  onEditPlan?(): void;
  onSteer?(text: string, when: "next" | "now"): void;
  /** A queued note's Apply now and Remove while running, each only when given. */
  onApplyNoteNow?(id: string): void;
  onRemoveNote?(id: string): void;
  onStop?(): void;
  /** The inline approval's (request, decision, { signal }) contract. */
  onDecision?: ApprovalCardProps["onDecision"];
  onRetryStep?(id: string): void;
  onSkipStep?(id: string): void;
  onReconnect?(id: string): void;
  primaryAction?: { label: ReactNode; onSelect(): void };
  /** The title's level; 3 by default. Nested headings sit one deeper. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<AgentTaskLabels>;
  /** Speak status and steering feedback politely, or leave announcements to the host. */
  announcement?: "polite" | "off";
  /** "card" sits on a tray; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
}

const pillStates: Record<AgentTaskProps["status"], StatusPillState> = {
  plan: "idle",
  running: "running",
  "needs-you": "needs-you",
  failed: "failed",
  stopped: "stopped",
  completed: "completed",
};

function AgentRunStep({
  step,
  number,
  copy,
  level,
  scope,
  agent,
  status,
  announcement,
  onApplyNoteNow,
  onRemoveNote,
  onDecision,
  onRetryStep,
  onSkipStep,
  onReconnect,
}: {
  step: AgentStep;
  number: number;
  copy: AgentTaskLabels;
  level: 2 | 3 | 4 | 5 | 6;
  scope: RefObject<HTMLElement | null>;
} & Pick<
  AgentTaskProps,
  | "agent"
  | "status"
  | "announcement"
  | "onApplyNoteNow"
  | "onRemoveNote"
  | "onDecision"
  | "onRetryStep"
  | "onSkipStep"
  | "onReconnect"
>) {
  const { config } = useSystem(),
    uid = useId();
  const [open, setOpen] = useState(false);
  const { triggerRef, panelProps } = useDisclosure(open);
  const tools = step.state === "completed" ? (step.tools ?? []) : [];
  // Once the task ends, a note the agent never picked up was not used.
  const ended =
    status === "completed" || status === "failed" || status === "stopped";
  // The ways forward the host offers; reconnecting, else retrying, is primary.
  const handlers = {
    retry: onRetryStep,
    skip: onSkipStep,
    reconnect: onReconnect,
  };
  const actions: DecisionAction[] = (step.error?.actions ?? []).flatMap(
    (kind) => {
      const run = handlers[kind];
      return run
        ? [{ id: kind, label: copy[kind], onSelect: () => run(step.id) }]
        : [];
    },
  );
  const forward =
    actions.find((action) => action.id === "reconnect") ??
    actions.find((action) => action.id === "retry");
  if (forward) forward.tone = "primary";
  return (
    <li className="tz-agent-run-step" data-state={step.state}>
      <span className="tz-agent-run-step-icon">
        <StatusIcon
          state={step.state === "planned" ? "pending" : step.state}
          number={number}
          tone="ai"
        />
        <span className="tz-visually-hidden tz-agent-run-step-state">
          {copy.stepStates[step.state]}
        </span>
      </span>
      <div className="tz-agent-run-step-main">
        <bdi
          id={`${uid}-title`}
          className={
            step.state === "running"
              ? "tz-agent-run-step-title tz-ai-shimmer"
              : "tz-agent-run-step-title"
          }
        >
          {step.title}
        </bdi>
        {step.agent != null && (
          <p className="tz-agent-run-step-agent">
            {copy.handedTo} <bdi>{step.agent}</bdi>
          </p>
        )}
        {(step.state === "skipped" || step.detail != null) && (
          <p className="tz-agent-run-step-detail">
            {step.state === "skipped" ? copy.skipped : step.detail}
          </p>
        )}
        {!!step.notes?.length && (
          <ul className="tz-agent-run-notes" role="list">
            {step.notes.map((note) => (
              <li key={note.id}>
                <span className="tz-mirror-rtl" aria-hidden="true">
                  ↳
                </span>
                <bdi>{note.text}</bdi>
                <span>
                  {" · "}
                  {note.applied
                    ? copy.pickedUp
                    : ended
                      ? copy.notUsed
                      : copy.waitingNote}
                </span>
                {/* Each acts on its own note only; when the note goes, the
                    task's focus rule moves focus to the task. */}
                {status === "running" &&
                  !note.applied &&
                  (onApplyNoteNow || onRemoveNote) && (
                    <span className="tz-agent-run-note-actions">
                      {onApplyNoteNow && (
                        <button
                          type="button"
                          className="tz-agent-run-note-action"
                          aria-label={copy.applyNoteNow(note.text)}
                          onClick={() => onApplyNoteNow(note.id)}
                        >
                          {copy.applyNow}
                        </button>
                      )}
                      {onRemoveNote && (
                        <button
                          type="button"
                          className="tz-agent-run-note-action"
                          aria-label={copy.removeNote(note.text)}
                          onClick={() => onRemoveNote(note.id)}
                        >
                          {copy.remove}
                        </button>
                      )}
                    </span>
                  )}
              </li>
            ))}
          </ul>
        )}
        {tools.length > 0 && (
          <>
            <button
              ref={triggerRef}
              id={`${uid}-details`}
              type="button"
              className="tz-agent-run-details"
              aria-expanded={open}
              aria-controls={`${uid}-tools`}
              aria-labelledby={`${uid}-details ${uid}-title`}
              onClick={() => setOpen(!open)}
            >
              {open ? copy.hideDetails : copy.details}
            </button>
            <div
              {...panelProps}
              id={`${uid}-tools`}
              className="tz-agent-run-tools"
              data-zone="evidence"
            >
              {tools.map((tool, index) => (
                <ToolCall
                  key={`${tool.tool}-${index}`}
                  {...tool}
                  appearance="plain"
                  announcement="off"
                  headingLevel={level}
                />
              ))}
            </div>
          </>
        )}
        {step.state === "needs-you" && step.request && (
          <div className="tz-agent-run-approval">
            {typeof onDecision === "function" ? (
              <ApprovalCard
                request={step.request}
                {...step.approval}
                announcement={
                  announcement === "off" ? "off" : step.approval?.announcement
                }
                agent={step.agent ?? agent}
                appearance="plain"
                headingLevel={level}
                onDecision={onDecision}
              />
            ) : (
              // No host to record a decision, so no actions (Decision 4).
              <p className="tz-agent-run-request">
                <strong dir="auto">{step.request.action}</strong>
                <span dir="auto">{step.request.target}</span>
              </p>
            )}
          </div>
        )}
        {step.state === "failed" && step.error && (
          <div className="tz-agent-run-error">
            <p>
              <strong>{step.error.title}</strong>
              {step.error.body != null && <span> {step.error.body}</span>}
            </p>
            {actions.length > 0 && (
              <DecisionBar actions={actions} scope={scope} />
            )}
          </div>
        )}
      </div>
      {step.duration !== undefined && (
        <span
          className="tz-agent-run-step-time"
          data-minutes={step.duration >= 60 || undefined}
        >
          {formatElapsed(step.duration, config)}
        </span>
      )}
    </li>
  );
}

/**
 * Agent task (spec §12.3): a multi-step job the agent runs while the person
 * stays in control. The host owns the status, the steps and the time; the
 * pattern names the state once, announces each status once, and reports
 * what the person asks for: start, steer, stop, decide, retry or skip.
 */
export function AgentTask({
  agentPresentation,
  title,
  agent,
  status,
  steps,
  elapsed,
  outputs,
  autoStartAfter,
  onStart,
  onEditPlan,
  onSteer,
  onApplyNoteNow,
  onRemoveNote,
  onStop,
  onDecision,
  onRetryStep,
  onSkipStep,
  onReconnect,
  primaryAction,
  headingLevel = 3,
  labels,
  announcement = "polite",
  appearance = "card",
}: AgentTaskProps) {
  const { config } = useSystem(),
    uid = useId();
  const copy: AgentTaskLabels = {
    ...agentTaskCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const root = useRef<HTMLElement>(null),
    said = useRef<HTMLSpanElement>(null),
    live = useRef<HTMLSpanElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    heard = useRef<string | null>(null),
    // Each note's `applied` as last rendered, so a pickup is said once.
    noted = useRef<Map<string, boolean> | null>(null),
    composing = useRef(false);
  const [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false),
    [draft, setDraft] = useState("");
  // A re-planned task restarts the wait before Ctrl or Cmd+Enter acts.
  const contentKey = JSON.stringify(steps.map((step) => [step.id, step.title]));
  const level = Math.min(headingLevel + 1, 6) as 2 | 3 | 4 | 5 | 6;
  const Heading = `h${headingLevel}` as const;
  // The step a footer names: the first in the given state, else the first
  // the run has not finished.
  const position = (state?: AgentStep["state"]) => {
    const index = steps.findIndex((step) => step.state === state);
    const reached = steps.findIndex(
      (step) => step.state !== "completed" && step.state !== "skipped",
    );
    return new Intl.NumberFormat(numberLocale(config)).format(
      Math.max(0, index >= 0 ? index : reached) + 1,
    );
  };
  const time = elapsed === undefined ? "" : formatElapsed(elapsed, config);
  const operations = steps.reduce(
    (sum, step) => sum + (step.tools?.length ?? 0),
    0,
  );
  // The countdown runs only when the host opted in and can start the plan.
  const countdown = status === "plan" && onStart ? autoStartAfter : undefined;
  const failed = steps.find((step) => step.state === "failed");
  const waiting = steps.find((step) => step.state === "needs-you");

  // One polite region, one sentence per status, never a time. It mounts empty
  // and takes the sentence after mount, as Countdown's does, so a screen
  // reader hears the first one too. The sentence renders hidden, so a title
  // that is markup still reads as its text.
  const sentence =
    status === "plan" ? (
      <>
        {copy.plan}
        {countdown !== undefined &&
          `. ${copy.autoStart(formatElapsed(countdown, config))}`}
      </>
    ) : status === "running" ? (
      copy.running
    ) : status === "needs-you" ? (
      <>
        {title}: {copy.needsDecision}
      </>
    ) : status === "failed" ? (
      <>
        {copy.failed}
        {failed?.error && <>: {failed.error.title}</>}
      </>
    ) : status === "stopped" ? (
      copy.stopped
    ) : (
      copy.done
    );
  useEffect(() => {
    const text = said.current?.textContent ?? "";
    // A note the agent picked up since the last render. Notes applied at
    // mount, and notes sent already applied (Steer now said so), are not news.
    const notes = steps.flatMap((step) => step.notes ?? []);
    const picked = notes
      .filter((note) => note.applied && noted.current?.get(note.id) === false)
      .map((note) => copy.pickedUpNote(note.text));
    noted.current = new Map(notes.map((note) => [note.id, note.applied]));
    if (announcement === "off") {
      heard.current = text;
      return;
    }
    // The status the task mounts in is not news, except a proposed plan, which
    // asks to be seen (§8 and §18 announce transitions only).
    if (heard.current === null && status !== "plan") {
      heard.current = text;
      return;
    }
    const news = [...(text !== heard.current ? [text] : []), ...picked];
    if (live.current && news.length > 0)
      live.current.textContent = news.join(". ");
    heard.current = text;
  });
  // When a change removes the focused control (Stop, Skip step, a note's Apply
  // now or Remove, the steering field), focus moves to the task rather than
  // dropping to the page.
  useLayoutEffect(() => {
    const element = lastFocus.current,
      node = root.current;
    if (!element || !node || element.isConnected) return;
    lastFocus.current = null;
    const active = node.ownerDocument.activeElement;
    if (!active || active === node.ownerDocument.body) node.focus();
  });

  function steer(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.altKey) return;
    // An input method's Enter picks a word; it never steers.
    if (
      composing.current ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229
    )
      return;
    // The field owns Enter and Ctrl or Cmd+Enter, so no other shortcut acts.
    event.preventDefault();
    if (event.repeat || (event.ctrlKey && event.metaKey)) return;
    const text = draft.trim();
    if (!text || !onSteer) return;
    const when = event.ctrlKey || event.metaKey ? "now" : "next";
    onSteer(text, when);
    setDraft("");
    // Say where the note went, once; the field alone would just clear.
    if (live.current)
      live.current.textContent =
        when === "now" ? copy.queuedNow(text) : copy.queuedNext(text);
  }

  const header = (
    <div className="tz-agent-run-header" data-zone="header">
      <AgentAvatar agent={agentPresentation} working={status === "running"} />
      <div className="tz-agent-run-heading">
        <Heading id={`${uid}-title`} className="tz-agent-run-title">
          {title}
        </Heading>
        <p className="tz-agent-run-agent">
          {(agentPresentation?.name ?? agent) != null && (
            <>{agentPresentation?.name ?? agent} · </>
          )}
          {copy.stepCount?.(steps.length) ??
            formatCount(steps.length, "step", config)}
        </p>
      </div>
      <StatusPill
        state={pillStates[status]}
        label={
          {
            plan: copy.plan,
            running: copy.running,
            "needs-you": copy.needsYou,
            failed: copy.failed,
            stopped: copy.stopped,
            completed: copy.completed,
          }[status]
        }
        elapsed={
          status === "running" || status === "completed" ? elapsed : undefined
        }
      />
      <AgentHeaderActions agent={agentPresentation} />
    </div>
  );

  const paper = (
    <>
      <ol className="tz-agent-run-steps" role="list">
        {steps.map((step, index) => (
          <AgentRunStep
            key={step.id}
            step={step}
            number={index + 1}
            copy={copy}
            level={level}
            scope={root}
            agent={agent}
            status={status}
            announcement={announcement}
            onApplyNoteNow={onApplyNoteNow}
            onRemoveNote={onRemoveNote}
            onDecision={onDecision}
            onRetryStep={onRetryStep}
            onSkipStep={onSkipStep}
            onReconnect={onReconnect}
          />
        ))}
      </ol>
      {status === "completed" && !!outputs?.length && (
        <div className="tz-agent-run-summary">
          <p>{copy.outputs}</p>
          <ul className="tz-agent-run-outputs" role="list">
            {outputs.map((output) => {
              const content = (
                <>
                  {output.icon != null && (
                    <span
                      className="tz-agent-run-output-icon"
                      aria-hidden="true"
                    >
                      {output.icon}
                    </span>
                  )}
                  <bdi>{output.label}</bdi>
                </>
              );
              return (
                <li key={output.id}>
                  {output.onOpen ? (
                    <button
                      type="button"
                      className="tz-agent-run-output"
                      onClick={() => output.onOpen?.()}
                    >
                      {content}
                    </button>
                  ) : (
                    <span className="tz-agent-run-output">{content}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );

  const meta = (text: ReactNode) => (
    <span className="tz-agent-run-meta" data-zone="meta">
      {text}
    </span>
  );
  const decide = (actions: DecisionAction[]) =>
    actions.length > 0 && (
      <div className="tz-agent-run-decision" data-zone="decision">
        <DecisionBar actions={actions} scope={root} contentKey={contentKey} />
      </div>
    );
  const footer =
    status === "plan" ? (
      <>
        {countdown !== undefined &&
          meta(
            <Countdown
              key={contentKey}
              seconds={countdown}
              paused={hovered || focused}
              onComplete={() => onStart?.()}
              label={copy.autoStart}
              announcement="off"
            />,
          )}
        {decide([
          ...(onEditPlan
            ? [
                {
                  id: "edit",
                  label: copy.editPlan,
                  onSelect: () => onEditPlan(),
                },
              ]
            : []),
          ...(onStart
            ? [
                {
                  id: "start",
                  label: copy.start,
                  tone: "primary" as const,
                  shortcut: "Mod+Enter" as const,
                  onSelect: () => onStart(),
                },
              ]
            : []),
        ])}
      </>
    ) : status === "running" ? (
      (onSteer || onStop) && (
        <div className="tz-agent-run-steer" data-zone="decision">
          {onSteer && (
            <>
              <Input
                className="tz-agent-run-steer-field"
                autoComplete="off"
                dir="auto"
                aria-label={copy.steer}
                aria-describedby={`${uid}-keys`}
                placeholder={copy.steer}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={steer}
                onCompositionStart={() => {
                  composing.current = true;
                }}
                onCompositionEnd={() => {
                  composing.current = false;
                }}
              />
              <span id={`${uid}-keys`} hidden>
                {`Enter: ${copy.steerNext} · ${applePlatform() ? "Cmd" : "Ctrl"}+Enter: ${copy.steerNow}`}
              </span>
            </>
          )}
          <div className="tz-agent-run-steer-row">
            {onSteer && (
              <span className="tz-agent-run-hints" aria-hidden="true">
                <span>
                  <Kbd keys={["Enter"]} />
                  {copy.steerNext}
                </span>
                <span>
                  <Kbd keys={["Mod", "Enter"]} />
                  {copy.steerNow}
                </span>
              </span>
            )}
            {onStop && (
              <DecisionBar
                actions={[
                  { id: "stop", label: copy.stop, onSelect: () => onStop() },
                ]}
                scope={root}
              />
            )}
          </div>
        </div>
      )
    ) : status === "needs-you" ? (
      meta(
        <>
          {copy.waiting(position("needs-you"))}
          {waiting?.approval?.expiryLabel != null && (
            <> · {waiting.approval.expiryLabel}</>
          )}
        </>,
      )
    ) : status === "failed" ? (
      meta(
        [copy.failedAt(position("failed")), time].filter(Boolean).join(" · "),
      )
    ) : status === "stopped" ? (
      meta([copy.stoppedAt(position()), time].filter(Boolean).join(" · "))
    ) : (
      <>
        {meta(
          [
            time,
            copy.operationCount?.(operations) ??
              formatCount(operations, "operation", config),
          ]
            .filter(Boolean)
            .join(" · "),
        )}
        {primaryAction &&
          decide([
            {
              id: "primary",
              label: primaryAction.label,
              tone: "primary",
              onSelect: () => primaryAction.onSelect(),
            },
          ])}
      </>
    );

  return (
    <section
      ref={root}
      tabIndex={-1}
      aria-labelledby={`${uid}-title`}
      className="tz-agent-run"
      data-agent-presentation={agentPresentation?.color ? "" : undefined}
      style={agentPresentationStyle(agentPresentation)}
      data-status={status}
      data-appearance={appearance}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) => {
        setFocused(true);
        lastFocus.current = event.target as HTMLElement;
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null))
          return;
        setFocused(false);
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
      <span ref={said} hidden>
        {sentence}
      </span>
      {appearance === "card" ? (
        <Tray paper={false} header={header} footer={footer || undefined}>
          <div className="tz-tray-paper tz-agent-run-paper" data-zone="paper">
            {paper}
          </div>
        </Tray>
      ) : (
        <>
          {header}
          <div className="tz-agent-run-paper" data-zone="paper">
            {paper}
          </div>
          {footer && <div className="tz-agent-run-footer">{footer}</div>}
        </>
      )}
    </section>
  );
}
