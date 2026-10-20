import { FileText } from "lucide-react";
import { useRef, useState } from "react";
import { AgentTask, numberLocale, useSystem } from "../../index";
import type {
  AgentStep,
  AgentTaskProps,
  ApprovalDecision,
  ApprovalDetails,
  ApprovalRequest,
  Numerals,
} from "../../index";
import { money, story } from "./finance-story";
type Language = "ar" | "en";
type Status = AgentTaskProps["status"];

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
    secondaryAction: {
      label: ar ? "عرض الرسائل" : "View the messages",
      // Open the three drafts in your own view.
      onSelect: () => {},
    },
  };
}
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
// Where the five close steps stand in each status, and the seconds the run
// has taken by then.
const runs: Record<Status, AgentStep["state"][]> = {
  plan: ["planned", "planned", "planned", "planned", "planned"],
  running: ["completed", "completed", "running", "pending", "pending"],
  "needs-you": ["completed", "completed", "completed", "needs-you", "pending"],
  failed: ["completed", "failed", "pending", "pending", "pending"],
  stopped: ["completed", "completed", "pending", "pending", "pending"],
  completed: ["completed", "completed", "completed", "completed", "completed"],
};
const elapsed: Record<Status, number | undefined> = {
  plan: undefined,
  running: 72,
  "needs-you": 132,
  failed: 64,
  stopped: 72,
  completed: 220,
};
const durations = [64, 48, 22, 9, 17];

export function AgentTaskExample({
  language = "ar",
  appearance = "card",
  autoStart = true,
  phase,
  onPhaseChange,
}: {
  language?: Language;
  appearance?: "card" | "plain";
  /** Starts a proposed plan on its own after five seconds. */
  autoStart?: boolean;
  /**
   * "plan", "running", "needs-you", "failed", "completed" or "stopped", held
   * as given. Starting, stopping, deciding, reconnecting or skipping moves the
   * task on and reports where it went.
   */
  phase?: string;
  onPhaseChange?: (phase: string) => void;
}) {
  const ar = language === "ar",
    { config } = useSystem();
  const t = (arabic: string, english: string) => (ar ? arabic : english);
  const n = (value: number) =>
    new Intl.NumberFormat(numberLocale(config, language)).format(value);
  const seconds = (value: number) => `${n(value)}${t("ث", "s")}`;
  // Without a phase the task rests on the request that waits for you.
  const [local, setLocal] = useState<Status>("needs-you");
  const status = (phase as Status | undefined) ?? local;
  // What the visitor did: steps skipped, the decision, steering notes.
  const [skipped, setSkipped] = useState<string[]>([]),
    [decision, setDecision] = useState<ApprovalDecision | null>(null),
    [notes, setNotes] = useState<
      Record<string, { id: string; text: string; applied: boolean }[]>
    >({}),
    noteCount = useRef(0);
  function move(next: Status) {
    setLocal(next);
    onPhaseChange?.(next);
  }
  const details = [
    t(
      `${n(217)} فاتورة · ${n(3)} فروقات`,
      `${n(217)} invoices · ${n(3)} differences`,
    ),
    t(
      `${n(3)} حسابات · ${n(94)} حركة`,
      `${n(3)} accounts · ${n(94)} transactions`,
    ),
    `${t(`${n(4)} قيود`, `${n(4)} entries`)} · ${money(story.closeSteps[2].amount, language, config.numerals)}`,
    t(`${n(3)} عملاء`, `${n(3)} customers`),
    t("ملف PDF من صفحة واحدة", "A one-page PDF"),
  ];
  // Each finished step's operations: what it did, the tool, its seconds.
  const tools: [label: string, tool: string, seconds: number][][] = [
    [
      [
        t("قراءة دفتر الموردين", "Read the supplier ledger"),
        "ledger.read",
        1.2,
      ],
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
        t("فتح الربط مع البنك الأهلي", "Open the Al Ahli connection"),
        "bank.connect",
        0.8,
      ],
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
  const rejected = status === "completed" && decision === "rejected";
  const steps: AgentStep[] = story.closeSteps.map((step, index) => {
    const state: AgentStep["state"] =
      (skipped.includes(step.id) && status !== "plan") ||
      (index === 3 && rejected)
        ? "skipped"
        : runs[status][index];
    return {
      id: step.id,
      title: step.title[language],
      detail:
        index === 3 && state === "completed"
          ? t(`أُرسلت ${n(3)} رسائل`, `${n(3)} reminders sent`)
          : details[index],
      state,
      duration:
        state === "completed"
          ? durations[index]
          : state === "running"
            ? 6
            : undefined,
      tools:
        state === "completed"
          ? tools[index].map(([label, tool, duration]) => ({
              label,
              tool,
              state: "completed" as const,
              duration: seconds(duration),
            }))
          : undefined,
      notes: notes[step.id],
      ...(index === 3
        ? {
            request: remindersRequest(language, config.numerals),
            approval: remindersDetails(language, config.numerals),
          }
        : {}),
      ...(index === 1 && state === "failed"
        ? {
            error: {
              title: t(
                "تعذّر الوصول إلى البنك الأهلي.",
                "Couldn't reach Al Ahli Bank.",
              ),
              body: t(
                "انتهت صلاحية الربط قبل يومين، فلم تُجلب حركات أكتوبر. لم يتغير شيء في الدفاتر.",
                "The connection expired two days ago, so October's transactions weren't fetched. Nothing in the books changed.",
              ),
              actions: ["skip", "reconnect"] as const,
            },
          }
        : {}),
    };
  });
  return (
    <AgentTask
      title={t("إقفال حسابات أكتوبر", "Close the October books")}
      agent={story.agents.finance[language]}
      status={status}
      steps={steps}
      elapsed={elapsed[status]}
      appearance={appearance}
      autoStartAfter={autoStart ? 5 : undefined}
      onStart={() => move("running")}
      // Open your plan editor here.
      onEditPlan={() => {}}
      onSteer={(text, when) => {
        // "now" reaches the running step; "next" waits for the one after.
        const running = steps.findIndex((step) => step.state === "running");
        const target = steps[when === "now" ? running : running + 1];
        if (!target) return;
        noteCount.current += 1;
        setNotes((all) => ({
          ...all,
          [target.id]: [
            ...(all[target.id] ?? []),
            { id: String(noteCount.current), text, applied: when === "now" },
          ],
        }));
      }}
      onStop={() => move("stopped")}
      onDecision={async (_request, chosen, { signal }) => {
        await recorded(signal);
        setDecision(chosen);
        move("completed");
      }}
      onReconnect={() => move("running")}
      onSkipStep={(id) => {
        setSkipped((ids) => [...ids, id]);
        move("running");
      }}
      outputs={[
        {
          id: "summary",
          label: t("ملخص الإقفال.pdf", "close-summary.pdf"),
          icon: <FileText />,
          // Open the file in your own viewer.
          onOpen: () => {},
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
                label: t(`${n(3)} تذكيرات مُرسلة`, `${n(3)} reminders sent`),
              },
            ]),
      ]}
      primaryAction={{
        label: t("فتح الملخص", "Open the summary"),
        // Show the summary in your own view.
        onSelect: () => {},
      }}
    />
  );
}
