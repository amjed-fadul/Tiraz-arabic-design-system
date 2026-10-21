/**
 * Close the month: a consumer exercise for Tiraz's Agent task and Approval
 * request patterns, built from ai/README.md, ai/registry.json,
 * ai/composition.md and the examples they link to.
 *
 * The screen has two parts. An Agent task runs the close, and two of its steps
 * stop for an inline Approval request. When the task completes, a standalone
 * Approval request asks to lock the period.
 *
 * The patterns own no lifecycle, so this host owns all of it: the task status,
 * the steps and their times, the steering notes and the decisions (`Host`).
 * The components report intents and the reducer records them.
 *
 * Rules from the docs this screen follows:
 *  - A decision counts only after `onDecision` resolves. It is validated
 *    (request identity, authority), awaited, checked against `signal`
 *    immediately before it is committed, and then only recorded.
 *  - Nothing is executed inside `onDecision`. The approved work runs later, in
 *    `execute`, which re-checks what the approval stood on when it runs.
 *  - An approval is one-time: a failed or interrupted attempt spends it, and
 *    trying again asks again. There is no approve-all, no preselected decision,
 *    no automatic approval, no expiry clock and no standing access.
 *  - A receipt is a decision, not an outcome: outcomes show on the step, and
 *    for the lock in a status message above its card.
 *  - Shortcuts belong to the patterns. This file binds no keys and moves no
 *    focus. `reversible` is set only on the request an offsetting entry can
 *    undo, `irreversible` on the two that cannot be recalled.
 *  - The Agent task shows its own approval (no ApprovalCard wrapped around it).
 *    The standalone ApprovalCard sits beside it, never inside it.
 *  - `lang` sits above SystemProvider and `direction` moves with it. Figures
 *    use `numberLocale(config, language)`. Latin identifiers sit in `<bdi>`.
 *  - `elapsed` and step durations change once a second, and every timer and
 *    pending job is cleared on Stop and on unmount.
 *
 * Nothing leaves memory. `acknowledge` and `execute` stand in for a server,
 * and the screen says so.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import {
  AgentTask,
  Alert,
  ApprovalCard,
  Button,
  Switch,
  SystemProvider,
  approvalRequestKey,
  defaultConfig,
  numberLocale,
  useSystem,
} from "../../../src/system";
import type {
  AgentStep,
  AgentTaskProps,
  ApprovalDecision,
  ApprovalDetails,
  ApprovalRecord,
  ApprovalRequest,
  SystemConfig,
} from "../../../src/system";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "../../../src/system/tokens.css";
import "../../../src/system/components.css";

type Language = "ar" | "en";
type Copy = { readonly ar: string; readonly en: string };
type Status = AgentTaskProps["status"];
type StepState = AgentStep["state"];

/* ------------------------------------------------------------------ data */

const PERIOD = { year: 2026, month: 10 } as const;

const STEP_IDS = [
  "supplier-invoices",
  "bank-reconciliation",
  "accruals",
  "payment-reminders",
  "close-summary",
] as const;
type StepId = (typeof STEP_IDS)[number];

/** Stable ids: they name what was approved, whatever language shows it. */
const REQUEST_ID = {
  accruals: "post-accruals-2026-10",
  reminders: "send-reminders-2026-10",
  lock: "lock-period-2026-10",
} as const;
type RequestId = (typeof REQUEST_ID)[keyof typeof REQUEST_ID];

/**
 * The close in order. `seconds` is how long the agent works before the step
 * finishes, or, for a step with a `request`, before it stops to ask.
 */
const SCRIPT: readonly { id: StepId; seconds: number; request?: RequestId }[] =
  [
    { id: "supplier-invoices", seconds: 3 },
    { id: "bank-reconciliation", seconds: 3 },
    { id: "accruals", seconds: 2, request: REQUEST_ID.accruals },
    { id: "payment-reminders", seconds: 2, request: REQUEST_ID.reminders },
    { id: "close-summary", seconds: 3 },
  ];

// Fictional figures. Counts in the copy ("four entries", "three customers")
// agree with these arrays.
const ACCRUALS = [
  {
    id: "audit",
    name: { ar: "أتعاب التدقيق", en: "Audit fees" },
    amount: 4_200,
  },
  {
    id: "utilities",
    name: { ar: "الكهرباء والمياه", en: "Utilities" },
    amount: 1_350,
  },
  {
    id: "freight",
    name: { ar: "شحن مستلَم بلا فاتورة", en: "Freight received, not invoiced" },
    amount: 2_100,
  },
  {
    id: "licences",
    name: { ar: "تراخيص البرمجيات", en: "Software licences" },
    amount: 900,
  },
] as const;
const OVERDUE = [
  {
    id: "gulf-dates",
    name: { ar: "شركة تمور الخليج", en: "Gulf Dates Company" },
    invoices: ["INV-2031", "INV-2036"],
    amount: 18_400,
  },
  {
    id: "riyadh-bakeries",
    name: { ar: "مخابز الرياض", en: "Riyadh Bakeries" },
    invoices: ["INV-2028"],
    amount: 9_750,
  },
  {
    id: "al-ofuq",
    name: { ar: "الأفق للتجهيزات", en: "Al Ofuq Supplies" },
    invoices: ["INV-2033", "INV-2040"],
    amount: 6_300,
  },
] as const;
const total = (rows: readonly { amount: number }[]) =>
  rows.reduce((sum, row) => sum + row.amount, 0);
const ACCRUAL_TOTAL = total(ACCRUALS);
const OVERDUE_TOTAL = total(OVERDUE);
const OVERDUE_INVOICES = OVERDUE.reduce(
  (sum, row) => sum + row.invoices.length,
  0,
);
const MATCHED_INVOICES = 184;
const DIFFERENCES = 5;
const TRANSACTIONS = 126;

const TITLES: Record<StepId, Copy> = {
  "supplier-invoices": {
    ar: "مطابقة فواتير الموردين",
    en: "Match supplier invoices",
  },
  "bank-reconciliation": {
    ar: "تسوية الحسابات البنكية",
    en: "Reconcile the bank accounts",
  },
  accruals: { ar: "ترحيل قيود الاستحقاق", en: "Post the accrual entries" },
  "payment-reminders": {
    ar: "إرسال تذكيرات الدفع",
    en: "Send payment reminders",
  },
  "close-summary": {
    ar: "إعداد ملخص الإقفال",
    en: "Prepare the close summary",
  },
};

/** What a finished step did, listed under its "Details". */
const OPERATIONS: Record<StepId, readonly { tool: string; label: Copy }[]> = {
  "supplier-invoices": [
    {
      tool: "ledger.read",
      label: { ar: "قراءة دفتر الموردين", en: "Read the supplier ledger" },
    },
    {
      tool: "po.match",
      label: {
        ar: "مطابقة الفواتير بأوامر الشراء",
        en: "Match invoices to purchase orders",
      },
    },
  ],
  "bank-reconciliation": [
    {
      tool: "bank.statements",
      label: { ar: "جلب كشفي الحسابين", en: "Fetch both account statements" },
    },
    {
      tool: "recon.match",
      label: {
        ar: "مطابقة الحركات بالدفتر",
        en: "Match transactions to the ledger",
      },
    },
  ],
  accruals: [
    {
      tool: "accruals.draft",
      label: { ar: "إعداد القيود الأربعة", en: "Draft the four entries" },
    },
    {
      tool: "ledger.post",
      label: { ar: "ترحيلها إلى دفتر الحسابات", en: "Post them to the ledger" },
    },
  ],
  "payment-reminders": [
    {
      tool: "mail.compose",
      label: { ar: "صياغة التذكيرات الثلاثة", en: "Write the three reminders" },
    },
    {
      tool: "mail.send",
      label: {
        ar: "الإرسال من بريد التحصيل",
        en: "Send from the collections mailbox",
      },
    },
  ],
  "close-summary": [
    {
      tool: "report.build",
      label: { ar: "جمع أرقام الإقفال", en: "Compile the close figures" },
    },
  ],
};

/** Why an approved step failed. The stand-in executor fails before any effect. */
const FAILURES: Partial<Record<StepId, { title: Copy; body: Copy }>> = {
  accruals: {
    title: { ar: "تعذّر ترحيل القيود.", en: "Couldn’t post the entries." },
    body: {
      ar: "رفض دفتر الحسابات الترحيل، فلم يُرحَّل أي قيد. استُهلكت موافقتك السابقة، لذا تحتاج إعادة المحاولة إلى موافقة جديدة.",
      en: "The ledger refused the posting, so no entry was posted. Your earlier approval is spent, so a retry asks you again.",
    },
  },
  "payment-reminders": {
    title: {
      ar: "تعذّر الإرسال من بريد التحصيل.",
      en: "Couldn’t send from the collections mailbox.",
    },
    body: {
      ar: "لم يُرسَل أي تذكير. استُهلكت موافقتك السابقة، لذا تحتاج إعادة المحاولة إلى موافقة جديدة.",
      en: "No reminder was sent. Your earlier approval is spent, so a retry asks you again.",
    },
  },
};

/* ------------------------------------------------------------ formatting */

interface Locale {
  language: Language;
  /** Picks the Arabic or the English copy. */
  t: (arabic: string, english: string) => string;
  n: (value: number) => string;
  sar: (value: number) => string;
  time: (at: number) => string;
  month: (month: number) => string;
  /** «أكتوبر ٢٠٢٦» / "October 2026". */
  period: string;
}

function makeLocale(language: Language, config: SystemConfig): Locale {
  // Digits follow config.numerals in Arabic and are always Western in English.
  const locale = numberLocale(config, language);
  const figures = new Intl.NumberFormat(locale);
  const riyals = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  });
  const clock = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
  const monthName = (month: number) =>
    new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(
      Date.UTC(PERIOD.year, month - 1, 1),
    );
  // A year is not a quantity: no grouping separator.
  const year = new Intl.NumberFormat(locale, { useGrouping: false }).format(
    PERIOD.year,
  );
  return {
    language,
    t: (arabic, english) => (language === "ar" ? arabic : english),
    n: (value) => figures.format(value),
    sar: (value) => riyals.format(value),
    time: (at) => clock.format(at),
    month: monthName,
    period: `${monthName(PERIOD.month)} ${year}`,
  };
}

/* ------------------------------------------------------------- host state */

interface Note {
  id: string;
  text: string;
  applied: boolean;
}
interface StepRun {
  state: StepState;
  /** Seconds the agent has spent on the step, over every attempt. */
  seconds: number;
  /** Seconds since the step last began its preparation. */
  prepared: number;
  notes: readonly Note[];
}
/** A decision as the host recorded it, in no language. */
interface Decision {
  decision: ApprovalDecision;
  at: number;
  /** What was approved, as plain data, compared again when the work runs. */
  params: string;
}
interface Job {
  requestId: RequestId;
  attempt: number;
}
interface Host {
  status: Status;
  /** Seconds of agent work. It ticks once a second, only while running. */
  elapsed: number;
  steps: Record<StepId, StepRun>;
  decisions: Partial<Record<RequestId, Decision>>;
  attempts: Partial<Record<RequestId, number>>;
  /** The approved work in flight. */
  job: Job | null;
  period: "open" | "locked";
  lockFailures: number;
  notes: number;
}
type Action =
  | { type: "start" }
  | { type: "tick" }
  | { type: "steer"; text: string; when: "next" | "now" }
  | { type: "stop" }
  | { type: "resume" }
  | {
      type: "decided";
      requestId: RequestId;
      decision: ApprovalDecision;
      at: number;
      params: string;
    }
  | { type: "executed"; requestId: RequestId; ok: boolean }
  | { type: "retry"; stepId: StepId }
  | { type: "skip"; stepId: StepId };

function initialHost(): Host {
  const idle: StepRun = {
    state: "planned",
    seconds: 0,
    prepared: 0,
    notes: [],
  };
  return {
    status: "plan",
    elapsed: 0,
    steps: Object.fromEntries(STEP_IDS.map((id) => [id, idle])) as Record<
      StepId,
      StepRun
    >,
    decisions: {},
    attempts: {},
    job: null,
    period: "open",
    lockFailures: 0,
    notes: 0,
  };
}

function withStep(host: Host, id: StepId, patch: Partial<StepRun>): Host {
  return {
    ...host,
    steps: { ...host.steps, [id]: { ...host.steps[id], ...patch } },
  };
}
function without(
  decisions: Host["decisions"],
  id: RequestId,
): Host["decisions"] {
  return Object.fromEntries(
    Object.entries(decisions).filter(([key]) => key !== id),
  ) as Host["decisions"];
}
/** Starts a step: the agent picks up the notes waiting for it. */
function begin(host: Host, id: StepId): Host {
  const { notes } = host.steps[id];
  return {
    ...withStep(host, id, {
      state: "running",
      prepared: 0,
      notes: notes.map((note) => ({ ...note, applied: true })),
    }),
    status: "running",
  };
}
/** Moves on after a step ends: the next pending step starts, or the task is done. */
function advance(host: Host, after: StepId): Host {
  const index = SCRIPT.findIndex((spec) => spec.id === after);
  const next = SCRIPT.slice(index + 1).find(
    (spec) => host.steps[spec.id].state === "pending",
  );
  return next ? begin(host, next.id) : { ...host, status: "completed" };
}
const runningSpec = (host: Host) =>
  SCRIPT.find((spec) => host.steps[spec.id].state === "running");

/** The one request waiting on the person right now, if any. */
function openRequest(host: Host): RequestId | null {
  if (host.status === "needs-you") {
    return (
      SCRIPT.find((spec) => host.steps[spec.id].state === "needs-you")
        ?.request ?? null
    );
  }
  const lockOpen =
    host.status === "completed" &&
    host.period === "open" &&
    host.job === null &&
    !host.decisions[REQUEST_ID.lock];
  return lockOpen ? REQUEST_ID.lock : null;
}

/** What an approval stands on, as plain data. The language is not part of it. */
function paramsOf(id: RequestId, host: Host): string {
  switch (id) {
    case REQUEST_ID.accruals:
      return JSON.stringify(ACCRUALS.map((entry) => [entry.id, entry.amount]));
    case REQUEST_ID.reminders:
      return JSON.stringify(
        OVERDUE.map((customer) => [
          customer.id,
          customer.amount,
          customer.invoices,
        ]),
      );
    case REQUEST_ID.lock:
      return JSON.stringify([
        PERIOD,
        host.steps.accruals.state,
        host.steps["payment-reminders"].state,
      ]);
  }
}

function reduce(host: Host, action: Action): Host {
  switch (action.type) {
    case "start": {
      if (host.status !== "plan") return host;
      const pending = Object.fromEntries(
        STEP_IDS.map((id) => [
          id,
          { ...host.steps[id], state: "pending" as const },
        ]),
      ) as Record<StepId, StepRun>;
      return begin({ ...host, steps: pending }, SCRIPT[0].id);
    }
    case "tick": {
      if (host.status !== "running") return host;
      const spec = runningSpec(host);
      if (!spec) return host;
      const run = host.steps[spec.id];
      const ticked: Host = {
        ...withStep(host, spec.id, {
          seconds: run.seconds + 1,
          prepared: run.prepared + 1,
        }),
        elapsed: host.elapsed + 1,
      };
      // Approved work in flight is finished by `executed`, never by the clock.
      const executing =
        spec.request !== undefined && host.job?.requestId === spec.request;
      if (executing || run.prepared + 1 < spec.seconds) return ticked;
      if (spec.request) {
        return {
          ...withStep(ticked, spec.id, { state: "needs-you" }),
          status: "needs-you",
        };
      }
      return advance(
        withStep(ticked, spec.id, { state: "completed" }),
        spec.id,
      );
    }
    case "steer": {
      const spec = runningSpec(host);
      if (host.status !== "running" || !spec) return host;
      const index = SCRIPT.findIndex((candidate) => candidate.id === spec.id);
      // "Next" lands on the following step; with none left it lands on this one.
      const target =
        action.when === "next" ? (SCRIPT[index + 1] ?? spec) : spec;
      const note: Note = {
        id: `note-${host.notes + 1}`,
        text: action.text,
        applied: target.id === spec.id,
      };
      return {
        ...withStep(host, target.id, {
          notes: [...host.steps[target.id].notes, note],
        }),
        notes: host.notes + 1,
      };
    }
    case "stop": {
      if (host.status !== "running") return host;
      const spec = runningSpec(host);
      let next: Host = { ...host, status: "stopped", job: null };
      if (spec) {
        next = withStep(next, spec.id, { state: "pending", prepared: 0 });
        // Stopping mid-work spends the approval: the effect may or may not
        // have happened, so a new decision is needed before it runs again.
        if (spec.request)
          next = { ...next, decisions: without(next.decisions, spec.request) };
      }
      return next;
    }
    case "resume": {
      if (host.status !== "stopped") return host;
      const next = SCRIPT.find(
        (spec) => host.steps[spec.id].state === "pending",
      );
      return next ? begin(host, next.id) : { ...host, status: "completed" };
    }
    case "decided": {
      // The reducer checks again, on the latest state, before it commits.
      if (openRequest(host) !== action.requestId) return host;
      const record: Decision = {
        decision: action.decision,
        at: action.at,
        params: action.params,
      };
      const decisions = { ...host.decisions, [action.requestId]: record };
      const approved = action.decision === "approved";
      const attempt = (host.attempts[action.requestId] ?? 0) + 1;
      const base: Host = approved
        ? {
            ...host,
            decisions,
            attempts: { ...host.attempts, [action.requestId]: attempt },
            job: { requestId: action.requestId, attempt },
          }
        : { ...host, decisions };
      if (action.requestId === REQUEST_ID.lock) return base;
      const spec = SCRIPT.find(
        (candidate) => candidate.request === action.requestId,
      );
      if (!spec) return host;
      return approved
        ? {
            ...withStep(base, spec.id, { state: "running", prepared: 0 }),
            status: "running",
          }
        : advance(withStep(base, spec.id, { state: "skipped" }), spec.id);
    }
    case "executed": {
      if (host.job?.requestId !== action.requestId) return host; // stale
      const done: Host = { ...host, job: null };
      if (action.requestId === REQUEST_ID.lock) {
        return action.ok
          ? { ...done, period: "locked" }
          : {
              ...done,
              decisions: without(done.decisions, action.requestId),
              lockFailures: done.lockFailures + 1,
            };
      }
      const spec = SCRIPT.find(
        (candidate) => candidate.request === action.requestId,
      );
      if (!spec) return host;
      return action.ok
        ? advance(withStep(done, spec.id, { state: "completed" }), spec.id)
        : {
            ...withStep(
              { ...done, decisions: without(done.decisions, action.requestId) },
              spec.id,
              { state: "failed" },
            ),
            status: "failed",
          };
    }
    case "retry": {
      // The failed attempt spent the approval, so the step prepares and asks again.
      if (
        host.status !== "failed" ||
        host.steps[action.stepId].state !== "failed"
      )
        return host;
      return begin(host, action.stepId);
    }
    case "skip": {
      if (
        host.status !== "failed" ||
        host.steps[action.stepId].state !== "failed"
      )
        return host;
      return advance(
        withStep(host, action.stepId, { state: "skipped" }),
        action.stepId,
      );
    }
  }
}

/* ------------------------------------------------- the server's stand-ins */

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const cancel = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, ms);
    signal.addEventListener("abort", cancel, { once: true });
  });
}
/** Stands in for the server recording a decision. */
const acknowledge = (signal: AbortSignal) => wait(700, signal);

/** Stands in for the server's check of who may decide which request. */
const MAY_DECIDE: readonly RequestId[] = Object.values(REQUEST_ID);
const mayDecide = (id: RequestId) => MAY_DECIDE.includes(id);

const isStepId = (id: string): id is StepId =>
  (STEP_IDS as readonly string[]).includes(id);
const isRequestId = (id: string): id is RequestId =>
  (Object.values(REQUEST_ID) as string[]).includes(id);

/**
 * Stands in for the executor of an approved action. It checks what the
 * approval stood on now, not when the button was pressed: the exact approved
 * parameters, the approver's authority and the state of the period. It reads
 * the host's own data, never the request object the card showed, and never the
 * steering notes, so nothing the person typed later widens an approval.
 */
async function execute(
  job: Job,
  host: Host,
  failFirstAttempt: boolean,
  signal: AbortSignal,
): Promise<boolean> {
  const record = host.decisions[job.requestId];
  const stands =
    record?.decision === "approved" &&
    record.params === paramsOf(job.requestId, host) &&
    mayDecide(job.requestId) &&
    host.period === "open";
  if (!stands) return false;
  await wait(1800, signal);
  return !(failFirstAttempt && job.attempt === 1);
}

/* ----------------------------------------------------------- the content */

function detailOf(id: StepId, run: StepRun, L: Locale): string {
  const { t, n, sar, month } = L;
  const done = run.state === "completed";
  // A skipped step shows the pattern's own words (rejected or skipped, the
  // person chose), so no detail is written for it.
  switch (id) {
    case "supplier-invoices":
      return done
        ? t(
            `${n(MATCHED_INVOICES)} فاتورة · ${n(DIFFERENCES)} فروقات للمراجعة`,
            `${n(MATCHED_INVOICES)} invoices · ${n(DIFFERENCES)} differences to review`,
          )
        : t(
            "كل فاتورة مقابل أمر الشراء وإيصال الاستلام",
            "Each invoice against its purchase order and goods receipt",
          );
    case "bank-reconciliation":
      return done
        ? t(
            `حسابان · ${n(TRANSACTIONS)} حركة مطابقة`,
            `Two accounts · ${n(TRANSACTIONS)} transactions matched`,
          )
        : t(
            "كشفا الحسابين مقابل دفتر الأستاذ",
            "Both account statements against the ledger",
          );
    case "accruals":
      return done
        ? t(
            `رُحّلت ${n(ACCRUALS.length)} قيود إلى دفتر ${month(PERIOD.month)}`,
            `Posted ${n(ACCRUALS.length)} entries to the ${month(PERIOD.month)} ledger`,
          )
        : t(
            `${n(ACCRUALS.length)} قيود بإجمالي ${sar(ACCRUAL_TOTAL)}`,
            `${n(ACCRUALS.length)} entries totalling ${sar(ACCRUAL_TOTAL)}`,
          );
    case "payment-reminders":
      return done
        ? t(
            `أُرسلت ${n(OVERDUE.length)} تذكيرات`,
            `${n(OVERDUE.length)} reminders sent`,
          )
        : t(
            "تذكير واحد لكل عميل من العملاء الثلاثة",
            "One reminder to each of the three customers",
          );
    case "close-summary":
      return done
        ? t("جُمعت أرقام الإقفال", "Close figures compiled")
        : t("صفحة واحدة للمدير المالي", "One page for the CFO");
  }
}

function requestFor(id: RequestId, L: Locale): ApprovalRequest {
  const { t, sar, month, period } = L;
  switch (id) {
    case REQUEST_ID.accruals:
      return {
        id,
        action: t(
          "ترحيل قيود الاستحقاق الأربعة",
          "Post the four accrual entries",
        ),
        target: t(`دفتر الحسابات · ${period}`, `General ledger · ${period}`),
        details: t(
          `الإجمالي ${sar(ACCRUAL_TOTAL)}`,
          `${sar(ACCRUAL_TOTAL)} in total`,
        ),
        consequences: [
          t(
            `تُرحَّل القيود الأربعة إلى دفتر ${month(PERIOD.month)}.`,
            `The four entries post to the ${month(PERIOD.month)} ledger.`,
          ),
          t(
            "يمكن عكسها بقيد مقابل إن لزم.",
            "An offsetting entry can reverse them if needed.",
          ),
        ],
        approveLabel: t("ترحيل القيود", "Post the entries"),
        rejectLabel: t("لا ترحّل", "Don’t post"),
      };
    case REQUEST_ID.reminders:
      return {
        id,
        action: t(
          "إرسال تذكيرات الدفع إلى العملاء الثلاثة",
          "Send payment reminders to the three customers",
        ),
        target: t(
          "العملاء المتأخرون في السداد",
          "Customers with overdue invoices",
        ),
        details: t(
          `الإجمالي ${sar(OVERDUE_TOTAL)} على ${L.n(OVERDUE_INVOICES)} فواتير`,
          `${sar(OVERDUE_TOTAL)} across ${L.n(OVERDUE_INVOICES)} invoices`,
        ),
        consequences: [
          t(
            "يصل كل عميل تذكير واحد بفواتيره المتأخرة.",
            "Each customer receives one reminder listing their overdue invoices.",
          ),
        ],
        approveLabel: t("أرسل التذكيرات", "Send the reminders"),
        rejectLabel: t("لا ترسل", "Don’t send"),
      };
    case REQUEST_ID.lock:
      return {
        id,
        action: t(`قفل فترة ${period}`, `Lock ${period}`),
        target: t(`دفتر الحسابات · ${period}`, `General ledger · ${period}`),
        consequences: [
          t(
            `لا يمكن ترحيل قيود جديدة إلى ${month(PERIOD.month)}.`,
            `No new entries can be posted to ${month(PERIOD.month)}.`,
          ),
          t(
            `تُسجَّل التصحيحات اللاحقة في ${month((PERIOD.month % 12) + 1)} بقيود تسوية.`,
            `Later corrections are recorded in ${month((PERIOD.month % 12) + 1)} as adjusting entries.`,
          ),
        ],
        approveLabel: t("اقفل الفترة", "Lock the period"),
        rejectLabel: t("أبقِ الفترة مفتوحة", "Keep it open"),
      };
  }
}

function detailsFor(id: RequestId, host: Host, L: Locale): ApprovalDetails {
  const { t, n, sar, language } = L;
  switch (id) {
    case REQUEST_ID.accruals:
      return {
        // Strings, so any change restarts the 500 ms wait before Ctrl or Cmd+Enter acts.
        impact: ACCRUALS.map((entry) => ({
          id: entry.id,
          label: entry.name[language],
          value: sar(entry.amount),
        })),
        // An offsetting entry reverses it: the only request here that may carry the shortcut.
        reversible: true,
      };
    case REQUEST_ID.reminders:
      return {
        impact: OVERDUE.map((customer) => ({
          id: customer.id,
          label: customer.name[language],
          value: sar(customer.amount),
          note: <bdi dir="ltr">{customer.invoices.join(" · ")}</bdi>,
        })),
        irreversible: t(
          "تُرسل من بريد التحصيل ولا يمكن استرجاعها بعد الإرسال.",
          "Sent from the collections mailbox; they can’t be recalled once sent.",
        ),
      };
    case REQUEST_ID.lock: {
      const posted = host.steps.accruals.state === "completed";
      const sent = host.steps["payment-reminders"].state === "completed";
      return {
        impact: [
          {
            id: "accruals",
            label: t("قيود الاستحقاق", "Accrual entries"),
            value: posted
              ? t(
                  `${n(ACCRUALS.length)} قيود · ${sar(ACCRUAL_TOTAL)}`,
                  `${n(ACCRUALS.length)} entries · ${sar(ACCRUAL_TOTAL)}`,
                )
              : t("لم تُرحَّل", "Not posted"),
          },
          {
            id: "reminders",
            label: t("تذكيرات الدفع", "Payment reminders"),
            value: sent ? n(OVERDUE.length) : t("لم تُرسل", "Not sent"),
          },
          {
            id: "differences",
            label: t("فروقات فواتير الموردين", "Supplier invoice differences"),
            value: n(DIFFERENCES),
          },
        ],
        irreversible: t(
          "لا يمكن إعادة فتح الفترة من هذه الشاشة.",
          "This screen can’t reopen the period.",
        ),
      };
    }
  }
}

function buildSteps(host: Host, L: Locale): AgentStep[] {
  return SCRIPT.map(({ id, request }) => {
    const run = host.steps[id];
    const failure = FAILURES[id];
    return {
      id,
      title: TITLES[id][L.language],
      detail: detailOf(id, run, L),
      state: run.state,
      duration:
        run.seconds > 0 && run.state !== "pending" && run.state !== "planned"
          ? run.seconds
          : undefined,
      tools:
        run.state === "completed"
          ? OPERATIONS[id].map(({ tool, label }) => ({
              label: label[L.language],
              tool,
              state: "completed" as const,
            }))
          : undefined,
      notes: run.notes.length > 0 ? run.notes : undefined,
      // The request travels with the step only while the step waits for the person.
      ...(run.state === "needs-you" && request
        ? {
            request: requestFor(request, L),
            approval: detailsFor(request, host, L),
          }
        : {}),
      ...(run.state === "failed" && failure
        ? {
            error: {
              title: failure.title[L.language],
              body: failure.body[L.language],
              actions: ["retry", "skip"] as const,
            },
          }
        : {}),
    };
  });
}

/* --------------------------------------------------------------- screens */

const page: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "var(--space-4)",
  maxInlineSize: "48rem",
  minInlineSize: 0,
  marginInline: "auto",
  padding: "var(--space-4)",
};
const bar: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-4)",
};
const heading: CSSProperties = {
  margin: 0,
  // `--text-heading` is a guess; the known `--text-subheading` is the fallback.
  fontSize: "var(--text-heading, var(--text-subheading))",
  fontWeight: "var(--weight-semibold)",
};
const meta: CSSProperties = {
  margin: 0,
  color: "var(--text-secondary)",
  fontSize: "var(--text-meta)",
};

function CloseScreen({
  language,
  onLanguageChange,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const { config } = useSystem();
  const L = makeLocale(language, config);
  const { t } = L;
  const [host, dispatch] = useReducer(reduce, undefined, initialHost);
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Callbacks and jobs read the latest state here instead of the render they
  // were created in: a decision resolves seconds after the click.
  const latest = useRef({ host, simulateFailure });
  useLayoutEffect(() => {
    latest.current = { host, simulateFailure };
  });

  // The one clock: it runs only while the agent is running, once a second.
  const running = host.status === "running";
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => clearInterval(timer);
  }, [running]);

  // Approved work runs here, after the decision is recorded and never inside
  // onDecision. Stop and unmount abort it; the job cannot undo what it did.
  useEffect(() => {
    const job = host.job;
    if (!job) return;
    const controller = new AbortController();
    const { host: snapshot, simulateFailure: failFirstAttempt } =
      latest.current;
    execute(job, snapshot, failFirstAttempt, controller.signal).then(
      (ok) => dispatch({ type: "executed", requestId: job.requestId, ok }),
      () => {
        if (!controller.signal.aborted) {
          dispatch({ type: "executed", requestId: job.requestId, ok: false });
        }
      },
    );
    return () => controller.abort();
  }, [host.job]);

  // The one decision handler for the inline approvals and the standalone card.
  const decide = useCallback(
    async (
      request: ApprovalRequest,
      decision: ApprovalDecision,
      { signal }: { signal: AbortSignal },
    ) => {
      const id = request.id;
      // Identity: only the request this host has open right now can be decided.
      if (!isRequestId(id) || openRequest(latest.current.host) !== id) {
        throw new Error("This request is not open.");
      }
      // Authority: never taken from the UI.
      if (!mayDecide(id))
        throw new Error("This request may not be decided here.");
      await acknowledge(signal);
      // Aborted (reset, replacement, unmount, a language change) means: record nothing.
      signal.throwIfAborted();
      // The world may have moved while waiting: look again just before committing.
      if (openRequest(latest.current.host) !== id)
        throw new Error("This request is closed.");
      dispatch({
        type: "decided",
        requestId: id,
        decision,
        at: Date.now(),
        params: paramsOf(id, latest.current.host),
      });
      // Nothing is executed here. The effect above runs the approved work.
    },
    [],
  );

  const steps = buildSteps(host, L);
  const posted = host.steps.accruals.state === "completed";
  const sent = host.steps["payment-reminders"].state === "completed";
  const outputs = [
    ...(posted
      ? [
          {
            id: "entries",
            label: t(
              `${L.n(ACCRUALS.length)} قيود مرحّلة`,
              `${L.n(ACCRUALS.length)} entries posted`,
            ),
          },
        ]
      : []),
    ...(sent
      ? [
          {
            id: "reminders",
            label: t(
              `${L.n(OVERDUE.length)} تذكيرات مرسلة`,
              `${L.n(OVERDUE.length)} reminders sent`,
            ),
          },
        ]
      : []),
  ];

  // The lock is a separate request, shown once the close is complete.
  const lockRequest = requestFor(REQUEST_ID.lock, L);
  const lockRecorded = host.decisions[REQUEST_ID.lock];
  const lockRecord: ApprovalRecord | null = lockRecorded
    ? {
        requestId: lockRequest.id,
        // Bound to the request as shown now: the same decision, in this language.
        requestKey: approvalRequestKey(lockRequest),
        decision: lockRecorded.decision,
      }
    : null;
  const locking = host.job?.requestId === REQUEST_ID.lock;
  const lockFailed =
    host.lockFailures > 0 && !lockRecorded && host.period === "open";
  const lockStatus = locking ? (
    <Alert
      tone="info"
      title={t("جارٍ قفل الفترة", "Locking the period")}
      description={t(`يُقفل ${L.period} الآن.`, `${L.period} is being locked.`)}
    />
  ) : host.period === "locked" ? (
    <Alert
      tone="success"
      title={t("قُفلت الفترة", "Period locked")}
      description={t(
        `قُفل ${L.period}. لم تعد القيود الجديدة تُرحَّل إليه.`,
        `${L.period} is locked. New entries no longer post to it.`,
      )}
    />
  ) : lockFailed ? (
    <Alert
      tone="error"
      title={t("تعذّر قفل الفترة", "Couldn’t lock the period")}
      description={t(
        "لم يتغير شيء، واستُهلكت موافقتك السابقة. راجع الطلب وقرّر من جديد.",
        "Nothing changed, and your earlier approval is spent. Review the request and decide again.",
      )}
    />
  ) : null;

  const other: Language = language === "ar" ? "en" : "ar";
  return (
    <main style={page}>
      <header style={bar}>
        <div style={{ display: "grid", gap: "var(--space-2)" }}>
          <h1 style={heading}>{t("إقفال الشهر", "Month-end close")}</h1>
          <p style={meta}>
            {L.period} · {t("فريق المالية", "Finance team")}
          </p>
        </div>
        <Button variant="secondary" onClick={() => onLanguageChange(other)}>
          <span lang={other}>{other === "en" ? "English" : "العربية"}</span>
        </Button>
      </header>

      <Alert
        title={t("عرض تجريبي", "Demo")}
        description={t(
          "تحاكي هذه الشاشة المنفِّذ: لا تُرسَل رسائل ولا تُرحَّل قيود فعلية، وتُمسح الحالة عند إعادة تحميل الصفحة.",
          "This screen stands in for the executor: no messages are sent, no entries are posted, and the state is cleared when the page reloads.",
        )}
      />
      <Switch
        label={t(
          "محاكاة فشل المحاولة الأولى",
          "Simulate a failed first attempt",
        )}
        description={t(
          "للتجربة فقط: يتعذّر تنفيذ كل إجراء موافَق عليه في المرة الأولى، وتلزم موافقة جديدة لإعادة المحاولة.",
          "Demo only: each approved action fails the first time, and a retry needs a new approval.",
        )}
        checked={simulateFailure}
        onCheckedChange={setSimulateFailure}
      />

      <AgentTask
        headingLevel={2}
        title={t(`إقفال حسابات ${L.period}`, `Close the ${L.period} books`)}
        agent={t("وكيل المالية", "Finance agent")}
        status={host.status}
        steps={steps}
        elapsed={host.status === "plan" ? undefined : host.elapsed}
        outputs={
          host.status === "completed" && outputs.length > 0
            ? outputs
            : undefined
        }
        onStart={() => dispatch({ type: "start" })}
        onSteer={(text, when) => dispatch({ type: "steer", text, when })}
        onStop={() => dispatch({ type: "stop" })}
        onDecision={decide}
        onRetryStep={(id) => {
          if (isStepId(id)) dispatch({ type: "retry", stepId: id });
        }}
        onSkipStep={(id) => {
          if (isStepId(id)) dispatch({ type: "skip", stepId: id });
        }}
      />
      {host.status === "stopped" ? (
        <div>
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: "resume" })}
          >
            {t("استئناف الإقفال", "Resume the close")}
          </Button>
        </div>
      ) : null}

      {host.status === "completed" ? (
        <>
          {/* The host's own live region, mounted before its first message. */}
          <div role="status">{lockStatus}</div>
          <ApprovalCard
            headingLevel={2}
            request={lockRequest}
            {...detailsFor(REQUEST_ID.lock, host, L)}
            // Controlled: null shows the pending proposal, and a failed
            // attempt bumps resetKey so the card asks afresh.
            value={lockRecord}
            resetKey={host.lockFailures}
            receiptTime={lockRecorded ? L.time(lockRecorded.at) : undefined}
            onDecision={decide}
          />
        </>
      ) : null}
    </main>
  );
}

export function CloseMonth() {
  const [language, setLanguage] = useState<Language>("ar");
  const config = useMemo<SystemConfig>(
    () => ({ ...defaultConfig, direction: language === "ar" ? "rtl" : "ltr" }),
    [language],
  );
  return (
    // `lang` goes above SystemProvider so portals and notices inherit it too.
    <div lang={language}>
      <SystemProvider config={config}>
        <CloseScreen language={language} onLanguageChange={setLanguage} />
      </SystemProvider>
    </div>
  );
}
