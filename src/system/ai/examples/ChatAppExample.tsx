import { Pencil, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import {
  AgentTask,
  AskUserQuestions,
  Button,
  ChatApp,
  ChatThread,
  CitedAnswer,
  Input,
  Modal,
  StatusPill,
  TaskStarter,
  numberLocale,
  useSystem,
} from "../../index";
import type {
  AgentStep,
  ApprovalDecision,
  ApprovalDetails,
  ApprovalRequest,
  FeedbackReason,
  Numerals,
  QuestionAnswers,
  SourceReference,
  UserQuestion,
} from "../../index";
import { money, story } from "./finance-story";
type Language = "ar" | "en";
type Turn =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      // A pattern, or the plain text the example answers a new request with.
      kind: "answer" | "questions" | "task" | "text";
      text?: string;
    };
type Conversation = {
  id: string;
  title: string;
  group: string;
  draft: string;
  turns: Turn[];
};
// How the task stands: it waits for the reminders' approval, then it is done.
type Task = {
  status: "needs-you" | "completed";
  decision: ApprovalDecision | null;
};

/** Stands in for your server: a decision is recorded after a moment. */
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
/** The reminders to the three customers, as the Approval request page asks. */
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
  };
}
/** The two things the finance agent asks before the close, answered. */
function closeQuestions(ar: boolean): UserQuestion[] {
  return [
    {
      id: "scope",
      label: ar
        ? "أي الفواتير أبدأ مطابقتها؟"
        : "Which invoices should I reconcile first?",
      choices: [
        {
          value: "suppliers",
          label: ar ? "فواتير الموردين" : "Supplier invoices",
        },
        {
          value: "customers",
          label: ar ? "فواتير العملاء" : "Customer invoices",
        },
      ],
      allowOther: true,
    },
    {
      id: "jeddah",
      label: ar
        ? "هل أستثني فرع جدة؟"
        : "Should I leave out the Jeddah branch?",
      choices: [
        { value: "exclude", label: ar ? "نعم، استثنِه" : "Yes, leave it out" },
        { value: "include", label: ar ? "لا، أدرجه" : "No, include it" },
      ],
    },
  ];
}
/** Laila's answers, which her conversation already holds. */
const closeAnswers: QuestionAnswers = {
  scope: { choice: "suppliers" },
  jeddah: { choice: "exclude" },
};
/**
 * The agent's questions with Laila's answers, as her conversation keeps them:
 * the host already holds the answers, so the questions mount as their receipt.
 */
function AnsweredQuestions({ language }: { language: Language }) {
  return (
    <AskUserQuestions
      appearance="plain"
      headingLevel={2}
      agent={story.agents.finance[language]}
      questions={closeQuestions(language === "ar")}
      value={closeAnswers}
      onValueChange={() => {}}
      receipt
      answered
      // Answered already: nothing is sent again.
      onSubmit={() => {}}
    />
  );
}

/** In-memory assistant workspace: the October close as a conversation. */
export function ChatAppExample({
  language = "ar",
  longContent = false,
}: {
  language?: Language;
  /** Gives the task's details a long run of operations to scroll through. */
  longContent?: boolean;
}) {
  return (
    <ChatAppHost key={language} language={language} longContent={longContent} />
  );
}
function ChatAppHost({
  language,
  longContent,
}: {
  language: Language;
  longContent: boolean;
}) {
  const ar = language === "ar",
    { config } = useSystem();
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const locale = numberLocale(config, language);
  const n = (value: number) => new Intl.NumberFormat(locale).format(value);
  const percent = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value / 100);
  const sar = (value: number, compact = false) =>
    money(value, language, config.numerals, { compact });
  const seconds = (value: number) => `${n(value)}${t("ث", "s")}`;
  const today = t("اليوم", "Today"),
    lastWeek = t("الأسبوع الماضي", "Last week");

  // The conversations Laila has had with the assistant. Only the October close
  // holds patterns; the others are short exchanges in plain text.
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    {
      id: "close",
      title: t("إقفال أكتوبر", "October close"),
      group: today,
      draft: "",
      turns: [
        {
          id: "close-1",
          role: "user",
          text: t(
            "لماذا انخفض التدفق النقدي في أكتوبر؟",
            "Why did cash flow fall in October?",
          ),
        },
        { id: "close-answer", role: "assistant", kind: "answer" },
        {
          id: "close-2",
          role: "user",
          text: t("جهّز إقفال أكتوبر", "Prepare the October close"),
        },
        { id: "close-questions", role: "assistant", kind: "questions" },
        { id: "close-task", role: "assistant", kind: "task" },
      ],
    },
    {
      id: "late",
      title: t("العملاء المتأخرون", "Late customers"),
      group: today,
      draft: "",
      turns: [
        {
          id: "late-1",
          role: "user",
          text: t(
            "من العملاء الأكثر تأخرًا في السداد؟",
            "Which customers pay latest?",
          ),
        },
        {
          id: "late-2",
          role: "assistant",
          kind: "text",
          text: t(
            `${story.customers.map((customer) => `${customer.name.ar} (${sar(customer.amount)})`).join("، ")}. مجموعها ${sar(story.overdue.largest.amount)}، أي ${percent(story.overdue.largest.share)} من المتأخرات.`,
            `${story.customers.map((customer) => `${customer.name.en} (${sar(customer.amount)})`).join(", ")}. Together they owe ${sar(story.overdue.largest.amount)}, ${percent(story.overdue.largest.share)} of the overdue amount.`,
          ),
        },
      ],
    },
    {
      id: "suppliers",
      title: t("فواتير الموردين", "Supplier invoices"),
      group: lastWeek,
      draft: "",
      turns: [
        {
          id: "suppliers-1",
          role: "user",
          text: t(
            "ماذا ظهر في مطابقة فواتير الموردين؟",
            "What did the supplier invoice match show?",
          ),
        },
        {
          id: "suppliers-2",
          role: "assistant",
          kind: "text",
          text: t(
            `طابقتُ ${n(story.closeSteps[0].invoices)} فاتورة، وظهرت ${n(story.closeSteps[0].differences)} فروقات تحتاج مراجعتك.`,
            `I matched ${n(story.closeSteps[0].invoices)} invoices, and ${n(story.closeSteps[0].differences)} differences need your review.`,
          ),
        },
      ],
    },
    {
      id: "forecast",
      title: t("توقعات التدفق النقدي", "Cash flow forecast"),
      group: lastWeek,
      draft: "",
      turns: [
        {
          id: "forecast-1",
          role: "user",
          text: t(
            "متى يعود النقد إلى مستواه السابق؟",
            "When does cash get back to where it was?",
          ),
        },
        {
          id: "forecast-2",
          role: "assistant",
          kind: "text",
          text: t(
            `يعود إلى نحو ${sar(story.forecast.cash, true)} بحلول ${new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(story.forecast.by))} ${story.forecast.condition.ar}.`,
            `It gets back to about ${sar(story.forecast.cash, true)} by ${new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(story.forecast.by))} ${story.forecast.condition.en}.`,
          ),
        },
      ],
    },
  ]);
  const [activeId, setActiveId] = useState("close");
  // The task waits for the reminders' approval until Laila decides.
  const [task, setTask] = useState<Task>({
    status: "needs-you",
    decision: null,
  });
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null),
    [reason, setReason] = useState<FeedbackReason>();
  // The rename dialog: which conversation, and the name in the field.
  const [renaming, setRenaming] = useState<string | null>(null),
    [name, setName] = useState("");
  // The delete dialog: which conversation, and its title, which stays put
  // while the dialog closes.
  const [deleting, setDeleting] = useState<string | null>(null),
    [doomed, setDoomed] = useState("");
  const sequence = useRef(0),
    field = useRef<HTMLInputElement>(null),
    formId = useId();
  const current = conversations.find((item) => item.id === activeId)!;
  function patch(id: string, update: (item: Conversation) => Conversation) {
    setConversations((previous) =>
      previous.map((item) => (item.id === id ? update(item) : item)),
    );
  }
  function blank(count: number): Conversation {
    return {
      id: `conversation-${++sequence.current}`,
      title: t(`محادثة ${n(count + 1)}`, `Chat ${count + 1}`),
      group: today,
      draft: "",
      turns: [],
    };
  }
  function startRename(id: string) {
    setName(conversations.find((item) => item.id === id)!.title);
    setRenaming(id);
  }
  function startDelete(id: string) {
    setDoomed(conversations.find((item) => item.id === id)!.title);
    setDeleting(id);
  }
  function remove(id: string) {
    const rest = conversations.filter((item) => item.id !== id);
    // The list is never empty: deleting the last conversation opens a new one.
    const next = rest.length ? rest : [blank(0)];
    setConversations(next);
    if (id === activeId) setActiveId(next[0].id);
  }
  function submit(text: string) {
    const id = ++sequence.current;
    patch(activeId, (item) => ({
      ...item,
      draft: "",
      turns: [
        ...item.turns,
        { id: `user-${id}`, role: "user", text },
        {
          id: `reply-${id}`,
          role: "assistant",
          kind: "text",
          // The example has no model; it answers every request alike.
          text: t(
            "استلمتُ طلبك، وسأعود إليك بالنتيجة.",
            "I've got your request, and I'll come back with the result.",
          ),
        },
      ],
    }));
  }

  // The answer to the first question, from the shared story.
  const answerText = t(
    `انخفض صافي التدفق النقدي في أكتوبر ${percent(-story.cash.netFlowChange)} عن سبتمبر رغم ارتفاع الإيرادات ${percent(story.revenue.change)} [1]، ويعود ذلك إلى سببين:

1. تأخّر ثلاثة عملاء كبار في السداد. بلغ مجموع فواتيرهم المتأخرة ${sar(story.overdue.largest.amount)}، أي ${percent(story.overdue.largest.share)} من إجمالي المتأخرات البالغ ${sar(story.overdue.amount)} [2].
2. دفعة مبكرة للنخبة للتغليف. دُفع ${sar(story.earlyPayment.amount)} في ${n(9)} أكتوبر مع أن موعدها ${n(30)} أكتوبر، مقابل خصم ${percent(story.earlyPayment.discount)} [3].`,
    `Net cash flow fell ${percent(-story.cash.netFlowChange)} from September even though revenue rose ${percent(story.revenue.change)} [1], for two reasons:

1. Three large customers paid late. Their overdue invoices total ${sar(story.overdue.largest.amount)}, ${percent(story.overdue.largest.share)} of the ${sar(story.overdue.amount)} overdue [2].
2. An early payment to Al Nukhba Packaging. ${sar(story.earlyPayment.amount)} went out on October ${n(9)}, due October ${n(30)}, for a ${percent(story.earlyPayment.discount)} discount [3].`,
  );
  const searched: SourceReference[] = story.sources.map((source) => ({
    id: source.id,
    number: source.number,
    title: source.title[language],
    href: `#${source.id}`,
  }));
  const followUps = [
    {
      id: "late",
      label: t(
        "من العملاء الأكثر تأخرًا في السداد؟",
        "Which customers pay latest?",
      ),
    },
    {
      id: "early",
      label: t(
        "ما أثر الدفعة المبكرة على الرصيد؟",
        "What did the early payment do to the balance?",
      ),
    },
  ];
  // A new conversation suggests where to start. Choosing one fills the draft.
  const suggestions = [
    {
      id: "close",
      label: t("جهّز إقفال أكتوبر", "Prepare the October close"),
    },
    followUps[0],
  ];
  const ask = (list: { id: string; label: string }[], id: string) =>
    patch(activeId, (item) => ({
      ...item,
      draft: list.find((entry) => entry.id === id)!.label,
    }));

  // The close task: Laila approved the first three steps' work, and the fourth
  // waits on her decision. Approving finishes it.
  const done = task.status === "completed",
    rejected = done && task.decision === "rejected";
  const details = [
    t(
      `${n(217)} فاتورة · ${n(3)} فروقات`,
      `${n(217)} invoices · ${n(3)} differences`,
    ),
    t(
      `${n(3)} حسابات · ${n(94)} حركة`,
      `${n(3)} accounts · ${n(94)} transactions`,
    ),
    `${t(`${n(4)} قيود`, `${n(4)} entries`)} · ${sar(story.closeSteps[2].amount)}`,
    done && !rejected
      ? t(`أُرسلت ${n(3)} رسائل`, `${n(3)} reminders sent`)
      : t(`${n(3)} عملاء`, `${n(3)} customers`),
    t("ملف PDF من صفحة واحدة", "A one-page PDF"),
  ];
  // What the agent did in each step, with the tool it used and its seconds. The
  // task keeps them under its details, and the side panel lays them out.
  const operations: [label: string, tool: string, duration: number][][] = [
    [
      [
        t("مطابقة الفواتير بأوامر الشراء", "Match invoices to purchase orders"),
        "po.match",
        2.9,
      ],
      [
        t("تسجيل الفروقات الثلاثة", "Log the three differences"),
        "variance.log",
        0.4,
      ],
    ],
    [
      [
        t("جلب كشف أكتوبر", "Fetch the October statement"),
        "bank.statement",
        1.1,
      ],
      [
        t(`مطابقة ${n(94)} حركة`, `Match ${n(94)} transactions`),
        "recon.match",
        1.7,
      ],
    ],
    [
      [
        t("إعداد القيود الأربعة", "Draft the four entries"),
        "accruals.draft",
        0.9,
      ],
      [
        t("ترحيل القيود إلى دفتر أكتوبر", "Post them to the October ledger"),
        "ledger.post",
        0.6,
      ],
    ],
    [
      [
        t("صياغة الرسائل الثلاث", "Write the three reminders"),
        "mail.compose",
        2.4,
      ],
      [
        t("الإرسال من بريد التحصيل", "Send from the collections mailbox"),
        "mail.send",
        0.7,
      ],
    ],
    [
      [t("إعداد الملخص", "Build the summary"), "report.build", 3.4],
      [
        t("حفظه في مجلد المالية", "Save it to the finance folder"),
        "drive.save",
        0.5,
      ],
    ],
  ];
  if (longContent)
    operations[0].push(
      ...Array.from({ length: 24 }, (_, index): [string, string, number] => [
        t(`مطابقة الدفعة ${n(index + 1)}`, `Match batch ${n(index + 1)}`),
        "po.match",
        0.3,
      ]),
    );
  const durations = [64, 48, 22, 9, 17];
  const steps: AgentStep[] = story.closeSteps.map((step, index) => {
    const state: AgentStep["state"] =
      index === 3 && rejected
        ? "skipped"
        : done || index < 3
          ? "completed"
          : index === 3
            ? "needs-you"
            : "pending";
    return {
      id: step.id,
      title: step.title[language],
      detail: details[index],
      state,
      duration: state === "completed" ? durations[index] : undefined,
      tools:
        state === "completed"
          ? operations[index].map(([label, tool, took]) => ({
              label,
              tool,
              state: "completed" as const,
              duration: seconds(took),
            }))
          : undefined,
      ...(index === 3
        ? {
            request: remindersRequest(language, config.numerals),
            approval: remindersDetails(language, config.numerals),
          }
        : {}),
    };
  });

  const finished = steps.filter((step) => step.state === "completed");
  const panel = current.id === "close" && (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "var(--text-subheading)",
            fontWeight: "var(--weight-semibold)",
          }}
        >
          {t("تفاصيل المهمة", "Task details")}
        </h2>
        <p
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            color: "var(--text-secondary)",
            fontSize: "var(--text-meta)",
          }}
        >
          <StatusPill
            state={done ? "completed" : "needs-you"}
            label={done ? t("اكتملت", "Done") : t("بانتظارك", "Needs you")}
          />
          {story.agents.finance[language]}
        </p>
      </div>
      {finished.map((step) => (
        <div key={step.id} style={{ display: "grid", gap: "var(--space-2)" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "var(--text-body)",
              fontWeight: "var(--weight-medium)",
            }}
          >
            {step.title}
          </h3>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "grid",
              gap: "var(--space-2)",
              fontSize: "var(--text-label)",
            }}
          >
            {step.tools?.map((operation) => (
              <li key={`${operation.tool}-${operation.label}`}>
                {operation.label}
                <small
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: "var(--text-meta)",
                  }}
                >
                  <bdi dir="ltr" style={{ fontFamily: "var(--font-mono)" }}>
                    {operation.tool}
                  </bdi>
                  {" · "}
                  {operation.duration}
                </small>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  const answer = (
    <CitedAnswer
      appearance="plain"
      headingLevel={2}
      status="completed"
      content={answerText}
      sources={searched.slice(0, 3)}
      thinking={{ elapsed: 6, searched }}
      duration={6.2}
      followUps={followUps}
      // Ask the question in the composer below.
      onFollowUp={(id) => ask(followUps, id)}
      feedback={feedback}
      reason={reason}
      onFeedbackChange={(value, why) => {
        setFeedback(value);
        setReason(why);
      }}
      onCopy={(text) => navigator.clipboard.writeText(text)}
    />
  );
  const agentTask = (
    <AgentTask
      appearance="plain"
      headingLevel={2}
      title={t("إقفال حسابات أكتوبر", "Close the October books")}
      agent={story.agents.finance[language]}
      status={task.status}
      steps={steps}
      elapsed={done ? 220 : 132}
      outputs={
        done
          ? [
              {
                id: "summary",
                label: t("ملخص الإقفال.pdf", "close-summary.pdf"),
              },
              {
                id: "entries",
                label: t(`${n(4)} قيود مسجّلة`, `${n(4)} entries posted`),
              },
              ...(rejected
                ? []
                : [
                    {
                      id: "reminders",
                      label: t(
                        `${n(3)} تذكيرات مُرسلة`,
                        `${n(3)} reminders sent`,
                      ),
                    },
                  ]),
            ]
          : undefined
      }
      // A decision counts once the stand-in server has recorded it; leaving
      // the conversation first cancels it.
      onDecision={async (_request, decision, { signal }) => {
        await recorded(signal);
        setTask({ status: "completed", decision });
      }}
    />
  );

  return (
    <div className="tz-chat-app-example">
      <ChatApp
        conversations={conversations}
        activeConversationId={activeId}
        onConversationSelect={setActiveId}
        onNewConversation={() => {
          const created = blank(conversations.length);
          setConversations((previous) => [...previous, created]);
          setActiveId(created.id);
        }}
        onConversationRename={startRename}
        // Your app owns the confirmation: the row only asks.
        onConversationDelete={startDelete}
        brand={story.team[language]}
        actions={
          <>
            {/* Renames the open conversation. The row menus open the same
                dialog, and it hands focus back to this button, its trigger. */}
            <Modal
              trigger={
                <Button
                  variant="ghost"
                  iconOnly
                  aria-label={t("إعادة تسمية المحادثة", "Rename conversation")}
                >
                  <Pencil size={16} aria-hidden="true" />
                </Button>
              }
              title={t("إعادة تسمية المحادثة", "Rename conversation")}
              description={t(
                "اختر اسمًا يسهل التعرّف عليه في القائمة.",
                "Choose a name that is easy to spot in the list.",
              )}
              closeLabel={t("إغلاق", "Close")}
              open={renaming !== null}
              onOpenChange={(next) => {
                if (next) startRename(activeId);
                else setRenaming(null);
              }}
              initialFocusRef={field}
              footer={
                <>
                  <Button variant="ghost" onClick={() => setRenaming(null)}>
                    {t("إلغاء", "Cancel")}
                  </Button>
                  <Button type="submit" form={formId} disabled={!name.trim()}>
                    {t("حفظ", "Save")}
                  </Button>
                </>
              }
            >
              <form
                id={formId}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (renaming === null || !name.trim()) return;
                  patch(renaming, (item) => ({ ...item, title: name.trim() }));
                  setRenaming(null);
                }}
              >
                <Input
                  ref={field}
                  label={t("اسم المحادثة", "Conversation name")}
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                />
              </form>
            </Modal>
            {/* Deletes a conversation only once it is confirmed here. The row
                menus open this dialog too, and focus comes back to this
                button, its trigger. */}
            <Modal
              trigger={
                <Button
                  variant="ghost"
                  iconOnly
                  aria-label={t("حذف المحادثة", "Delete conversation")}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              }
              title={t(`حذف «${doomed}»؟`, `Delete “${doomed}”?`)}
              description={t(
                "تُحذف المحادثة بكل رسائلها.",
                "The conversation and all its messages are deleted.",
              )}
              closeLabel={t("إغلاق", "Close")}
              open={deleting !== null}
              onOpenChange={(next) => {
                if (next) startDelete(activeId);
                else setDeleting(null);
              }}
              footer={
                <>
                  <Button variant="ghost" onClick={() => setDeleting(null)}>
                    {t("إلغاء", "Cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (deleting !== null) remove(deleting);
                      setDeleting(null);
                    }}
                  >
                    {t("حذف", "Delete")}
                  </Button>
                </>
              }
            >
              <p style={{ margin: 0 }}>
                {t("لا يمكن التراجع عن ذلك.", "This can't be undone.")}
              </p>
            </Modal>
          </>
        }
        sidePanel={panel || undefined}
        labels={{ sidePanel: t("تفاصيل المهمة", "Task details") }}
        composer={
          <TaskStarter
            key={activeId}
            appearance="plain"
            labels={{
              placeholder: t(
                "اطلب مهمة أو اسأل عن بياناتك…",
                "Ask for a task or about your data…",
              ),
            }}
            greeting={
              current.turns.length === 0
                ? t(`مرحبًا يا ${story.user.ar}`, `Hello, ${story.user.en}`)
                : undefined
            }
            value={current.draft}
            onValueChange={(draft) =>
              patch(activeId, (item) => ({ ...item, draft }))
            }
            onSubmit={submit}
            suggestions={current.turns.length === 0 ? suggestions : undefined}
            onSuggestion={(id) => ask(suggestions, id)}
          />
        }
      >
        <ChatThread
          key={activeId}
          followOutput
          label={t("الرسائل", "Messages")}
          messages={current.turns.map((turn) => ({
            id: turn.id,
            role: turn.role,
            content:
              turn.role === "user" || turn.kind === "text" ? (
                turn.text
              ) : turn.kind === "answer" ? (
                answer
              ) : turn.kind === "questions" ? (
                <AnsweredQuestions language={language} />
              ) : (
                agentTask
              ),
          }))}
        />
      </ChatApp>
    </div>
  );
}
