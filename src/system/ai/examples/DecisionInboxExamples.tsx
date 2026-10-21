import { useEffect, useRef, useState } from "react";
import { DecisionInbox, numberLocale, useSystem } from "../../index";
import type {
  ApprovalDetails,
  ApprovalRequest,
  DecisionInboxItem,
  Numerals,
  StatusPillState,
} from "../../index";
import { money, story } from "./finance-story";
type Language = "ar" | "en";
type Phase = "waiting" | "expanded" | "empty";
/** What your records say happened to an item. */
type Outcome = "approved" | "rejected" | "answered" | "retried";

/** The reminders to the three customers: they can't be recalled once sent. */
function remindersRequest(
  language: Language,
  numerals: Numerals | undefined,
): ApprovalRequest {
  const ar = language === "ar",
    percent = new Intl.NumberFormat(numberLocale({ numerals }, language), {
      style: "percent",
    }).format(story.overdue.largest.share / 100),
    total = money(story.overdue.largest.amount, language, numerals);
  return {
    id: "payment-reminders-oct",
    action: ar
      ? "إرسال تذكيرات الدفع إلى العملاء الثلاثة"
      : "Send payment reminders to the three customers",
    target: ar
      ? "العملاء المتأخرون في السداد"
      : "Customers with overdue invoices",
    details: ar
      ? `الإجمالي ${total}، أي ${percent} من المتأخرات`
      : `${total} in total, ${percent} of the overdue amount`,
    consequences: [
      ar
        ? "يصل كل عميل تذكير واحد بفواتيره المتأخرة."
        : "Each customer receives one reminder listing their overdue invoices.",
    ],
    approveLabel: ar ? "أرسل الرسائل" : "Send the reminders",
    rejectLabel: ar ? "رفض" : "Reject",
  };
}
function remindersDetails(
  language: Language,
  numerals: Numerals | undefined,
): ApprovalDetails {
  const ar = language === "ar",
    hours = new Intl.NumberFormat(numberLocale({ numerals }, language)).format(
      23,
    );
  return {
    impact: story.customers.map((customer) => ({
      id: customer.id,
      label: customer.name[language],
      note: (
        <bdi dir="ltr">
          {customer.invoices.map((invoice) => invoice.id).join(" · ")}
        </bdi>
      ),
      value: money(customer.amount, language, numerals),
    })),
    irreversible: ar
      ? "تُرسل من بريد التحصيل، ولا يمكن استرجاعها بعد الإرسال."
      : "Sent from the collections mailbox. They can't be recalled once sent.",
    expiryLabel: ar
      ? `ينتهي الطلب خلال ${hours} ساعة`
      : `This request expires in ${hours} hours`,
    secondaryAction: {
      label: ar ? "عرض الرسائل" : "View the messages",
      // Open the three drafts in your own view.
      onSelect: () => {},
    },
  };
}
/** The four accrual entries, which an offsetting entry can reverse. */
function accrualsRequest(
  language: Language,
  numerals: Numerals | undefined,
): ApprovalRequest {
  const ar = language === "ar",
    total = money(story.closeSteps[2].amount, language, numerals);
  return {
    id: "accruals-oct",
    action: ar
      ? "ترحيل قيود الاستحقاق الأربعة"
      : "Post the four accrual entries",
    target: story.sources[0].title[language],
    details: ar ? `الإجمالي ${total}` : `${total} in total`,
    consequences: [
      ar
        ? "تُرحَّل القيود إلى دفتر أكتوبر، ويمكن عكسها بقيد مقابل."
        : "The entries post to the October ledger and can be reversed with an offsetting entry.",
    ],
    approveLabel: ar ? "ترحيل القيود" : "Post the entries",
    rejectLabel: ar ? "رفض" : "Reject",
  };
}
/** Stands in for your server: a decision or an answer is recorded after a moment. */
function recorded(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 700);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelled", "AbortError"));
      },
      { once: true },
    );
  });
}

export function DecisionInboxExample({
  language = "ar",
  appearance = "card",
  phase,
  onPhaseChange,
}: {
  language?: Language;
  appearance?: "card" | "plain";
  /**
   * "waiting", "expanded" (the reminders open) or "empty", where it starts.
   * Deciding, answering, retrying or opening a row moves it on and reports
   * where it went.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    { config } = useSystem();
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const n = (value: number) =>
    new Intl.NumberFormat(numberLocale(config, language)).format(value);
  const ago = (minutes: number) =>
    t(`قبل ${n(minutes)} د`, `${n(minutes)} min ago`);
  const agents = {
    finance: { id: "finance", name: story.agents.finance[language] },
    collections: {
      id: "collections",
      name: story.agents.collections[language],
    },
    campaigns: { id: "campaigns", name: story.agents.campaigns[language] },
  };
  const close = t("ضمن إقفال حسابات أكتوبر", "Part of Closing October");
  const reminders = remindersRequest(language, config.numerals),
    accruals = accrualsRequest(language, config.numerals),
    madar = story.customers[0];
  // Most urgent first: the host knows what is urgent, and the inbox keeps
  // its order.
  const waiting: DecisionInboxItem[] = [
    {
      id: "reminders",
      title: reminders.action,
      agent: agents.collections,
      context: close,
      status: "needs-you",
      time: ago(4),
      request: reminders,
      approval: remindersDetails(language, config.numerals),
      steps: [
        {
          id: "aging",
          label: t("تجميع الفواتير المتأخرة", "Gather the overdue invoices"),
          state: "completed",
          time: ago(10),
        },
        {
          id: "write",
          label: t("صياغة الرسائل الثلاث", "Write the three reminders"),
          state: "completed",
          time: ago(6),
        },
        {
          id: "send",
          label: t("إرسال التذكيرات", "Send the reminders"),
          state: "needs-you",
        },
      ],
    },
    {
      id: "accruals",
      title: accruals.action,
      agent: agents.finance,
      context: close,
      status: "needs-you",
      time: ago(9),
      request: accruals,
      // Reversible, so the row can decide it without opening.
      approval: { reversible: true },
    },
    {
      id: "jeddah",
      title: t("هل أستثني فرع جدة؟", "Should I leave out the Jeddah branch?"),
      agent: agents.finance,
      context: close,
      status: "needs-you",
      time: ago(12),
      questions: [
        {
          id: "jeddah",
          label: t(
            "هل أستثني فرع جدة؟",
            "Should I leave out the Jeddah branch?",
          ),
          choices: [
            {
              value: "exclude",
              label: t("نعم، استثنِه", "Yes, leave it out"),
            },
            { value: "include", label: t("لا، أدرجه", "No, include it") },
          ],
        },
      ],
    },
    {
      id: "draft",
      title: t(
        `تذكير بالدفع إلى ${story.draft.recipient.ar}`,
        `Payment reminder to ${story.draft.recipient.en}`,
      ),
      agent: agents.collections,
      context: (
        <>
          {madar.name[language]} · <bdi dir="ltr">{story.draft.invoice}</bdi> ·{" "}
          {money(story.draft.amount, language, config.numerals)}
        </>
      ),
      status: "needs-you",
      time: ago(20),
      draft: true,
    },
    {
      id: "campaign",
      title: t("غلاف حملة رمضان", "Ramadan campaign cover"),
      agent: agents.campaigns,
      status: "failed",
      time: ago(35),
      error: t("تعذّر توليد الصورة", "The image couldn't be generated"),
    },
  ];
  const others: DecisionInboxItem[] = [
    {
      id: "close",
      title: t("إقفال حسابات أكتوبر", "Closing October"),
      agent: agents.finance,
      status: "running",
      time: t(`منذ ${n(14)} د`, `for ${n(14)} min`),
    },
    {
      id: "suppliers",
      title: story.closeSteps[0].title[language],
      agent: agents.finance,
      context: close,
      status: "completed",
      time: t("قبل ساعة", "an hour ago"),
    },
  ];
  // What your records say happened to each item. A receipt says only that:
  // approved, rejected or answered, never more.
  const [start] = useState(phase);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const receipts = {
    approved: t("تمت الموافقة · الآن", "Approved · just now"),
    rejected: t("رُفض الطلب · الآن", "Request rejected · just now"),
    answered: t("أُرسلت إجاباتك · الآن", "Your answers were sent · just now"),
  };
  const items = (start === "empty" ? others : [...waiting, ...others]).map(
    (item): DecisionInboxItem => {
      const outcome = outcomes[item.id];
      return !outcome
        ? item
        : outcome === "retried"
          ? { ...item, status: "running", error: undefined }
          : { ...item, status: "completed", receipt: receipts[outcome] };
    },
  );
  const [expanded, setExpanded] = useState<string[]>(
    start === "expanded" ? ["reminders"] : [],
  );
  const [agent, setAgent] = useState<string | null>(null);
  const record = (id: string, outcome: Outcome) =>
    setOutcomes((current) => ({ ...current, [id]: outcome }));
  // Each agent's state, from its items: waiting first, then failed, running.
  const stateOf = (id: string): StatusPillState => {
    const own = items.filter((item) => item.agent.id === id);
    return own.some((item) => item.status === "needs-you")
      ? "needs-you"
      : own.some((item) => item.status === "failed")
        ? "failed"
        : own.some((item) => item.status === "running")
          ? "running"
          : "idle";
  };
  // Report where the visitor moved the inbox.
  const now: Phase = !items.some(
    (item) => item.status === "needs-you" || item.status === "failed",
  )
    ? "empty"
    : expanded.length > 0
      ? "expanded"
      : "waiting";
  const reported = useRef(phase ?? now);
  useEffect(() => {
    if (reported.current === now) return;
    reported.current = now;
    onPhaseChange?.(now);
  });
  return (
    <DecisionInbox
      items={items}
      expanded={expanded}
      onExpandedChange={setExpanded}
      agents={Object.values(agents).map((entry) => ({
        ...entry,
        state: stateOf(entry.id),
      }))}
      agent={agent}
      onAgentChange={setAgent}
      // Record the decision, then mark the item done with what happened. A
      // cancelled or failed save throws first, so nothing is marked.
      onDecision={async (request, decision, { signal }) => {
        await recorded(signal);
        const item = items.find((entry) => entry.request?.id === request.id);
        if (item) record(item.id, decision);
      }}
      onAnswer={async (id, _answers, { signal }) => {
        await recorded(signal);
        record(id, "answered");
      }}
      // Start the task again: it runs, and leaves «بانتظارك».
      onRetry={(id) => record(id, "retried")}
      // Open the task, or the draft for review, in your own view.
      onOpen={() => {}}
      appearance={appearance}
    />
  );
}
