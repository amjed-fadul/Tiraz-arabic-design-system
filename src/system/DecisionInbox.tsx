import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { FocusEvent, KeyboardEvent, ReactNode } from "react";
import { AIMark } from "./AIMark";
import { ApprovalCard } from "./ApprovalCard";
import type {
  ApprovalCardProps,
  ApprovalDecision,
  ApprovalDetails,
  ApprovalRequest,
} from "./ApprovalCard";
import { AskUserQuestions } from "./AskUserQuestions";
import type { QuestionAnswers, UserQuestion } from "./AskUserQuestions";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { StatusIcon } from "./StatusIcon";
import { StatusPill } from "./StatusPill";
import type { StatusPillState } from "./StatusPill";
import { Tabs } from "./Tabs";
import type { TaskState } from "./TaskRows";
import { Tray } from "./Tray";
import { approvalRequestKey } from "./approval-request";
import { numberLocale } from "./config";
import { approvalCardCopy } from "./decision-copy";
import { decisionInboxCopy } from "./decision-inbox-copy";
import { useDecisionTask } from "./decision-task";
import { EscapeFoldsContext } from "./escape-folds";
import { formatCount } from "./format";
import { useDisclosure } from "./useDisclosure";
import { useSystem } from "./useSystem";
import { toolLabelsCopy } from "./useToolLabels";

export type DecisionInboxTab = "all" | "needs-you" | "running" | "completed";
/** One thing an agent waits on the person for, or works at. */
export interface DecisionInboxItem {
  /** Unique and stable. */
  id: string;
  title: ReactNode;
  /** The agent it comes from. */
  agent: { id: string; name: ReactNode };
  /** One line, such as «ضمن إقفال حسابات أكتوبر». */
  context?: ReactNode;
  /** Failed items wait on the person with the needs-you ones. */
  status: "needs-you" | "running" | "failed" | "completed";
  /** Host-formatted, such as «قبل ٤ د». */
  time?: ReactNode;
  /** An approval, shown in full as an Approval request when its row opens… */
  request?: ApprovalRequest;
  approval?: ApprovalDetails;
  /** …or questions, answered in the row… */
  questions?: readonly UserQuestion[];
  /** …or a draft waiting for review, which the host opens. */
  draft?: boolean;
  /** The last three or four steps, oldest first. */
  steps?: readonly {
    id: string;
    label: ReactNode;
    state: TaskState;
    time?: ReactNode;
  }[];
  /** A failed item's error, shown as text in its row. */
  error?: ReactNode;
  /** What happened, shown while the row leaves its tab. */
  receipt?: ReactNode;
}
/** Every built-in string the inbox shows; `labels` overrides any of them. */
export interface DecisionInboxLabels {
  title: string;
  /** Names the tabs. */
  byStatus: string;
  tabs: Record<DecisionInboxTab, string>;
  /** Each row's pill by its status, and a draft's while it waits. */
  pills: Record<DecisionInboxItem["status"], string>;
  draft: string;
  /** Names the agents strip. */
  agents: string;
  /** Heads an open row's steps. */
  steps: string;
  /** The row actions; each is also named by its row's title. */
  review: string;
  answer: string;
  retry: string;
  open: string;
  /** The region's sentence, from the counts and the count helper's words. */
  waiting: (count: number, requests: string) => string;
  running: (count: number, tasks: string) => string;
  /** Said when nothing waits or runs, and the empty «بانتظارك»'s title. */
  nothingWaiting: string;
  nothingWaitingHint: string;
  /** Any other empty tab. */
  nothingHere: string;
}
export interface DecisionInboxProps {
  /** In the host's order, most urgent first. */
  items: readonly DecisionInboxItem[];
  /** The shown tab; «بانتظارك» by default. */
  tab?: DecisionInboxTab;
  onTabChange?: (tab: DecisionInboxTab) => void;
  /** The open rows' ids; none by default. */
  expanded?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  /** The agents strip: a toggle per agent, with its state in words. */
  agents?: readonly { id: string; name: ReactNode; state: StatusPillState }[];
  /** The picked agent, which filters the rows and the counts. */
  agent?: string | null;
  onAgentChange?: (id: string | null) => void;
  /** Records a decision: the open card's, or a reversible row's quick one. */
  onDecision?: ApprovalCardProps["onDecision"];
  onAnswer?: (
    id: string,
    answers: QuestionAnswers,
    context: { signal: AbortSignal },
  ) => void | Promise<void>;
  onRetry?: (id: string) => void;
  onOpen?: (id: string) => void;
  /** Seconds a row the host moved out of the tab stays; 0 moves it at once. */
  receiptFor?: number;
  title?: ReactNode;
  /** The title's level; 3 by default. Rows sit one deeper. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<DecisionInboxLabels>;
  /** "card" sits on a tray; "plain" lives on its host's paper. */
  appearance?: "card" | "plain";
}

const tabs: readonly DecisionInboxTab[] = [
  "all",
  "needs-you",
  "running",
  "completed",
];
// The statuses each tab shows: failed tasks wait on the person too.
const holds: Record<DecisionInboxTab, readonly DecisionInboxItem["status"][]> =
  {
    all: ["needs-you", "running", "failed", "completed"],
    "needs-you": ["needs-you", "failed"],
    running: ["running"],
    completed: ["completed"],
  };
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);
const noAnswers: QuestionAnswers = {};

function InboxRow({
  item,
  copy,
  level,
  expanded,
  onExpandedChange,
  leaving,
  receiptFor,
  onLeft,
  onTitle,
  answers,
  onAnswers,
  onDecision,
  onAnswer,
  onRetry,
  onOpen,
}: {
  item: DecisionInboxItem;
  copy: DecisionInboxLabels;
  level: 2 | 3 | 4 | 5 | 6;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
  /** Moved out of the shown tab by the host, and held for its receipt. */
  leaving: boolean;
  receiptFor: number;
  onLeft: (id: string) => void;
  onTitle: (id: string, element: HTMLElement | null) => void;
  answers: QuestionAnswers;
  onAnswers: (id: string, answers: QuestionAnswers) => void;
} & Pick<
  DecisionInboxProps,
  "onDecision" | "onAnswer" | "onRetry" | "onOpen"
>) {
  const { config } = useSystem(),
    uid = useId();
  const ar = config.direction === "rtl",
    titleId = `${uid}-title`,
    panelId = `${uid}-panel`;
  const waits = item.status === "needs-you";
  const request = waits ? item.request : undefined;
  const questions =
    waits && !request && item.questions?.length ? item.questions : undefined;
  const steps = item.steps ?? [];
  const approval = item.approval ?? {};
  // A row opens only when it has something to show.
  const opens = steps.length > 0 || !!request || !!questions;
  const open = opens && expanded;
  const { triggerRef, panelProps } = useDisclosure(open);
  const Heading = `h${level}` as const;
  const deeper = Math.min(level + 1, 6) as 3 | 4 | 5 | 6;

  // A quick decision belongs to the request as it stood when it was made: a
  // change to it, its expiry or its reversibility aborts one in flight, so a
  // late resolve records nothing, and forgets one already accepted.
  const key = request
    ? JSON.stringify([
        approvalRequestKey(request),
        approval.reversible,
        !!approval.irreversible,
        approval.expired,
      ])
    : "";
  const task = useDecisionTask(),
    { cancel } = task;
  const [decided, setDecided] = useState<{
    key: string;
    decision: ApprovalDecision;
  } | null>(null);
  const [pending, setPending] = useState<ApprovalDecision | null>(null);
  if (decided && decided.key !== key) setDecided(null);
  useLayoutEffect(() => cancel, [key, cancel]);
  const accepted = decided?.decision ?? null;
  const submitting = task.state === "submitting";
  // Only a reversible request decides from its closed row, and with no
  // shortcut (Decision 4); any other opens into the full request.
  const quick =
    !!request &&
    typeof onDecision === "function" &&
    approval.reversible === true &&
    !approval.irreversible &&
    !approval.expired;
  function decide(decision: ApprovalDecision) {
    if (!request || !onDecision) return;
    const at = key;
    setPending(decision);
    void task.run(
      (signal) => onDecision(request, decision, { signal }),
      () => setDecided({ key: at, decision }),
    );
  }
  const words = { ...approvalCardCopy[ar ? "ar" : "en"], ...approval.labels };
  const receipt =
    item.receipt ?? (accepted ? words[accepted] : copy.pills[item.status]);

  // Focus never drops to the page: when the control that held it goes, such
  // as an accepted quick decision or Try again, the row's title takes it.
  const title = useRef<HTMLElement | null>(null),
    lastFocus = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const element = lastFocus.current,
      target = title.current;
    if (!element || element.isConnected || !target) return;
    lastFocus.current = null;
    const active = target.ownerDocument.activeElement;
    if (!active || active === target.ownerDocument.body) target.focus();
  });
  const setTitle = useCallback(
    (element: HTMLElement | null) => {
      title.current = element;
      onTitle(item.id, element);
    },
    [item.id, onTitle],
  );
  const setTrigger = useCallback(
    (element: HTMLButtonElement | null) => {
      triggerRef.current = element;
      setTitle(element);
    },
    [triggerRef, setTitle],
  );
  // A row the host moved out of the tab leaves once its receipt was seen.
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => onLeft(item.id), receiptFor * 1000);
    return () => clearTimeout(timer);
  }, [leaving, receiptFor, onLeft, item.id]);

  function toggle() {
    // A row opens only once its quick decision in flight is settled.
    if (!open && submitting) return;
    onExpandedChange(!open);
  }
  // Escape anywhere in an open row folds it and records nothing, the card
  // included: the row takes the key before the card can (Decision 5).
  function fold(event: KeyboardEvent<HTMLLIElement>) {
    if (event.key !== "Escape" || !open || event.nativeEvent.isComposing)
      return;
    event.preventDefault();
    title.current?.focus();
    onExpandedChange(false);
  }
  // Each action is named by its own word and then the row's title.
  const named = (part: string) => ({
    id: `${uid}-${part}`,
    "aria-labelledby": `${uid}-${part} ${titleId}`,
  });
  // A failed quick decision says so beside the buttons it keeps.
  const hint =
    quick && !open && !leaving && !accepted && task.state === "failed";
  // A second trigger for the row's disclosure.
  const disclose = (label: string) => (
    <Button
      variant="secondary"
      {...named("review")}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={toggle}
    >
      {label}
    </Button>
  );
  const actions: ReactNode =
    leaving || accepted
      ? null
      : quick
        ? !open &&
          (["rejected", "approved"] as const).map((decision) => (
            <Button
              key={decision}
              variant="secondary"
              {...named(decision)}
              aria-describedby={hint ? `${uid}-hint` : undefined}
              state={submitting && pending === decision ? "loading" : "idle"}
              disabled={submitting}
              onClick={() => decide(decision)}
            >
              {decision === "approved"
                ? request?.approveLabel
                : request?.rejectLabel}
            </Button>
          ))
        : request
          ? disclose(copy.review)
          : questions
            ? disclose(copy.answer)
            : waits && item.draft
              ? onOpen && (
                  <Button
                    variant="secondary"
                    {...named("open")}
                    onClick={() => onOpen(item.id)}
                  >
                    {copy.review}
                  </Button>
                )
              : item.status === "failed"
                ? onRetry && (
                    <Button
                      variant="secondary"
                      {...named("retry")}
                      onClick={() => onRetry(item.id)}
                    >
                      {copy.retry}
                    </Button>
                  )
                : !waits &&
                  onOpen && (
                    <Button
                      variant="secondary"
                      {...named("open")}
                      onClick={() => onOpen(item.id)}
                    >
                      {copy.open}
                    </Button>
                  );
  const stepWords = toolLabelsCopy[ar ? "ar" : "en"];

  return (
    <li
      className="tz-decision-inbox-row"
      data-row={item.id}
      data-status={item.status}
      data-open={open || undefined}
      onFocus={(event) => {
        lastFocus.current = event.target as HTMLElement;
      }}
      onBlur={(event: FocusEvent<HTMLLIElement>) => {
        // Focus moved elsewhere on purpose is never reclaimed; a control that
        // is removed drops focus to the page, with no related target.
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget as Node)
        )
          lastFocus.current = null;
      }}
      onKeyDownCapture={fold}
    >
      <EscapeFoldsContext.Provider value={true}>
        {opens ? (
          <Heading className="tz-decision-inbox-heading">
            <button
              ref={setTrigger}
              id={titleId}
              type="button"
              className="tz-decision-inbox-trigger"
              aria-expanded={open}
              aria-controls={panelId}
              aria-disabled={(!open && submitting) || undefined}
              onClick={toggle}
            >
              <bdi>{item.title}</bdi>
              <ChevronDown aria-hidden="true" />
            </button>
          </Heading>
        ) : (
          <Heading
            ref={setTitle}
            id={titleId}
            tabIndex={-1}
            className="tz-decision-inbox-heading"
          >
            <bdi>{item.title}</bdi>
          </Heading>
        )}
        <p className="tz-decision-inbox-meta">
          <bdi>{item.agent.name}</bdi>
          {item.context != null && <> · {item.context}</>}
          {item.time != null && <> · {item.time}</>}
        </p>
        {leaving || accepted ? (
          // The receipt says what actually happened: the host's, else the
          // accepted decision's, else the status the host moved it to.
          <span className="tz-decision-inbox-receipt">{receipt}</span>
        ) : (
          <StatusPill
            state={item.status}
            label={waits && item.draft ? copy.draft : copy.pills[item.status]}
          />
        )}
        {item.status === "failed" && item.error != null && (
          <p className="tz-decision-inbox-error">{item.error}</p>
        )}
        {opens && (
          <div {...panelProps} id={panelId} className="tz-decision-inbox-panel">
            {open && (
              <>
                {steps.length > 0 && (
                  <div className="tz-decision-inbox-steps" data-zone="evidence">
                    <p
                      id={`${uid}-steps`}
                      className="tz-decision-inbox-steps-title"
                    >
                      {copy.steps}
                    </p>
                    <ol role="list" aria-labelledby={`${uid}-steps`}>
                      {steps.map((step) => (
                        <li key={step.id} className="tz-decision-inbox-step">
                          <StatusIcon state={step.state} tone="ai" />
                          <span className="tz-visually-hidden">
                            {stepWords[step.state]}
                          </span>
                          <bdi>{step.label}</bdi>
                          {step.time != null && (
                            <span className="tz-decision-inbox-step-time">
                              {step.time}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {request && (
                  <div
                    className="tz-decision-inbox-request"
                    data-zone="decision"
                  >
                    {typeof onDecision === "function" ? (
                      <ApprovalCard
                        request={request}
                        {...item.approval}
                        appearance="plain"
                        headingLevel={deeper}
                        onDecision={onDecision}
                        value={
                          accepted
                            ? {
                                requestId: request.id,
                                requestKey: approvalRequestKey(request),
                                decision: accepted,
                              }
                            : undefined
                        }
                      />
                    ) : (
                      // No host to record a decision, so no actions (Plan 4
                      // Decision 4).
                      <p className="tz-decision-inbox-request-text">
                        <strong dir="auto">{request.action}</strong>
                        <span dir="auto">{request.target}</span>
                      </p>
                    )}
                  </div>
                )}
                {questions && (
                  <div
                    className="tz-decision-inbox-request"
                    data-zone="decision"
                  >
                    {onAnswer ? (
                      <AskUserQuestions
                        questions={questions}
                        value={answers}
                        onValueChange={(next) => onAnswers(item.id, next)}
                        onSubmit={(given, context) =>
                          onAnswer(item.id, given, context)
                        }
                        appearance="plain"
                        headingLevel={deeper}
                      />
                    ) : (
                      // No host to take the answers, so the questions only.
                      <ul
                        role="list"
                        className="tz-decision-inbox-request-text"
                      >
                        {questions.map((question) => (
                          <li key={question.id} dir="auto">
                            {question.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {(actions || hint) && (
          <div className="tz-decision-inbox-actions">
            {hint && (
              <p id={`${uid}-hint`} className="tz-decision-inbox-hint">
                {words.retryHint}
              </p>
            )}
            {actions}
          </div>
        )}
      </EscapeFoldsContext.Provider>
    </li>
  );
}

/**
 * Decision inbox (spec section 13.2): what every agent waits on the person
 * for, most urgent first, in tabs with counts. A row opens into the full
 * Approval request or Clarifying questions, and only a reversible request
 * decides from its closed row. There is no approve-all. The host owns every
 * item and its status; a row the host moves out of the shown tab stays for
 * its receipt, then leaves, and focus never drops to the page. One polite
 * region speaks only when the counts change.
 */
export function DecisionInbox({
  items,
  tab: tabProp,
  onTabChange,
  expanded: expandedProp,
  onExpandedChange,
  agents,
  agent: agentProp,
  onAgentChange,
  onDecision,
  onAnswer,
  onRetry,
  onOpen,
  receiptFor = 5,
  title,
  headingLevel = 3,
  labels,
  appearance = "card",
}: DecisionInboxProps) {
  const { config } = useSystem(),
    uid = useId();
  const copy: DecisionInboxLabels = {
    ...decisionInboxCopy[config.direction === "rtl" ? "ar" : "en"],
    ...labels,
  };
  const [localTab, setLocalTab] = useState<DecisionInboxTab>("needs-you"),
    [localExpanded, setLocalExpanded] = useState<readonly string[]>([]),
    [localAgent, setLocalAgent] = useState<string | null>(null),
    // Each question row's draft answers, kept here so a host holds none.
    [drafts, setDrafts] = useState<Record<string, QuestionAnswers>>({});
  const tab = tabProp ?? localTab,
    expanded = expandedProp ?? localExpanded,
    agent = agentProp === undefined ? localAgent : agentProp;
  // The picked agent filters the rows and the counts.
  const mine = items.filter((item) => agent == null || item.agent.id === agent);
  const count = (which: DecisionInboxTab) =>
    mine.filter((item) => holds[which].includes(item.status)).length;

  // The rows: the host's items in the shown tab, in its order, and those the
  // host just moved out of it, held in place for their receipt (Decision 6).
  // Changing the tab or the agent lets go of them.
  const scope = JSON.stringify([tab, agent]),
    fitting = mine
      .filter((item) => holds[tab].includes(item.status))
      .map((item) => item.id);
  const [view, setView] = useState(() => ({
    scope,
    fitting,
    held: [] as readonly string[],
  }));
  let held: readonly string[] = [];
  if (view.scope === scope && receiptFor > 0) {
    const present = new Set(mine.map((item) => item.id));
    const out = (id: string) => present.has(id) && !fitting.includes(id);
    held = view.held.filter(out);
    for (const id of view.fitting)
      if (out(id) && !held.includes(id)) held = [...held, id];
  }
  if (
    view.scope !== scope ||
    !same(view.fitting, fitting) ||
    !same(view.held, held)
  )
    setView({ scope, fitting, held });
  const release = useCallback(
    (id: string) =>
      setView((current) => ({
        ...current,
        held: current.held.filter((other) => other !== id),
      })),
    [],
  );
  const rows = mine.filter(
    (item) => fitting.includes(item.id) || held.includes(item.id),
  );
  const ids = rows.map((item) => item.id);

  // When a row leaves, or the host deletes it, while focus was in it, focus
  // goes to the next row's title, else the previous one's, else the tab panel.
  const root = useRef<HTMLElement>(null),
    titles = useRef(new Map<string, HTMLElement>()),
    lastFocus = useRef<HTMLElement | null>(null),
    focusedRow = useRef<string | null>(null),
    order = useRef<readonly string[]>([]);
  useLayoutEffect(() => {
    const before = order.current,
      element = lastFocus.current,
      gone = focusedRow.current,
      node = root.current;
    order.current = ids;
    if (!element || !gone || !node || element.isConnected) return;
    if (ids.includes(gone)) return;
    lastFocus.current = null;
    focusedRow.current = null;
    const active = node.ownerDocument.activeElement;
    if (active && active !== node.ownerDocument.body) return;
    const at = before.indexOf(gone);
    const next =
      before.slice(at + 1).find((id) => ids.includes(id)) ??
      before
        .slice(0, Math.max(at, 0))
        .reverse()
        .find((id) => ids.includes(id));
    (next
      ? titles.current.get(next)
      : node.querySelector<HTMLElement>(
          '[role="tabpanel"][data-state="active"]',
        )
    )?.focus();
  });
  const onTitle = useCallback((id: string, element: HTMLElement | null) => {
    if (element) titles.current.set(id, element);
    else titles.current.delete(id);
  }, []);
  const keepAnswers = useCallback(
    (id: string, answers: QuestionAnswers) =>
      setDrafts((current) => ({ ...current, [id]: answers })),
    [],
  );

  // One polite region, empty at mount, speaks only when the counts change.
  // Waiting counts needs-you and failed items as requests, running ones as
  // tasks.
  const live = useRef<HTMLSpanElement>(null),
    heard = useRef<string | null>(null);
  const waiting = count("needs-you"),
    running = count("running"),
    counts = `${waiting} ${running}`;
  const sentence =
    [
      waiting > 0
        ? copy.waiting(waiting, formatCount(waiting, "request", config))
        : "",
      running > 0
        ? copy.running(running, formatCount(running, "task", config))
        : "",
    ]
      .filter(Boolean)
      .join(" · ") || copy.nothingWaiting;
  useEffect(() => {
    if (heard.current === null) {
      heard.current = counts;
      return;
    }
    if (heard.current === counts || !live.current) return;
    heard.current = counts;
    live.current.textContent = sentence;
  });

  function pickTab(next: DecisionInboxTab) {
    if (tabProp === undefined) setLocalTab(next);
    onTabChange?.(next);
  }
  function pickAgent(id: string) {
    const next = agent === id ? null : id;
    if (agentProp === undefined) setLocalAgent(next);
    onAgentChange?.(next);
  }
  function openRow(id: string, open: boolean) {
    const next = expanded.filter((other) => other !== id);
    if (open) next.push(id);
    if (expandedProp === undefined) setLocalExpanded(next);
    onExpandedChange?.(next);
  }

  const Heading = `h${headingLevel}` as const;
  const level = Math.min(headingLevel + 1, 6) as 3 | 4 | 5 | 6;
  const digits = new Intl.NumberFormat(numberLocale(config));
  const header = (
    <div className="tz-decision-inbox-header" data-zone="header">
      <AIMark />
      <Heading id={`${uid}-title`} className="tz-decision-inbox-title">
        {title ?? copy.title}
      </Heading>
    </div>
  );
  const list =
    rows.length > 0 ? (
      <ul role="list" className="tz-decision-inbox-rows">
        {rows.map((item) => (
          <InboxRow
            key={item.id}
            item={item}
            copy={copy}
            level={level}
            expanded={expanded.includes(item.id)}
            onExpandedChange={(open) => openRow(item.id, open)}
            leaving={held.includes(item.id)}
            receiptFor={receiptFor}
            onLeft={release}
            onTitle={onTitle}
            answers={drafts[item.id] ?? noAnswers}
            onAnswers={keepAnswers}
            onDecision={onDecision}
            onAnswer={onAnswer}
            onRetry={onRetry}
            onOpen={onOpen}
          />
        ))}
      </ul>
    ) : (
      <div className="tz-decision-inbox-empty">
        <p className="tz-decision-inbox-empty-title">
          {tab === "needs-you" ? copy.nothingWaiting : copy.nothingHere}
        </p>
        {tab === "needs-you" && <p>{copy.nothingWaitingHint}</p>}
      </div>
    );
  const paper = (
    <>
      {!!agents?.length && (
        <div
          role="group"
          aria-label={copy.agents}
          className="tz-decision-inbox-agents"
        >
          {agents.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="tz-decision-inbox-agent"
              aria-pressed={agent === entry.id}
              onClick={() => pickAgent(entry.id)}
            >
              <bdi>{entry.name}</bdi>
              <StatusPill state={entry.state} />
            </button>
          ))}
        </div>
      )}
      <Tabs
        className="tz-decision-inbox-tabs"
        label={copy.byStatus}
        value={tab}
        onValueChange={(value) => pickTab(value as DecisionInboxTab)}
        items={tabs.map((which) => ({
          value: which,
          label: (
            <span className="tz-decision-inbox-tab">
              {copy.tabs[which]}{" "}
              <Badge className="tz-decision-inbox-count">
                {digits.format(count(which))}
              </Badge>
            </span>
          ),
          content: which === tab ? list : null,
        }))}
      />
    </>
  );
  return (
    <section
      ref={root}
      aria-labelledby={`${uid}-title`}
      className="tz-decision-inbox"
      data-appearance={appearance}
      onFocus={(event) => {
        const target = event.target as HTMLElement;
        lastFocus.current = target;
        focusedRow.current =
          target.closest(".tz-decision-inbox-row")?.getAttribute("data-row") ??
          null;
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget as Node)
        ) {
          lastFocus.current = null;
          focusedRow.current = null;
        }
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
        <Tray paper={false} header={header}>
          <div
            className="tz-tray-paper tz-decision-inbox-paper"
            data-zone="paper"
          >
            {paper}
          </div>
        </Tray>
      ) : (
        <>
          {header}
          <div className="tz-decision-inbox-paper" data-zone="paper">
            {paper}
          </div>
        </>
      )}
    </section>
  );
}
