import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import {
  AgentTask,
  Badge,
  Button,
  ChangeSummary,
  DecisionInbox,
  Sheet,
  Tray,
} from "../../system";
import type {
  AgentStep,
  ApprovalDecision,
  ChangeSummaryProps,
  DecisionInboxItem,
} from "../../system";
import { story } from "../../system/ai/examples/finance-story";
import { ScreenFrame, ScreenHeader } from "../frame/ScreenFrame";
import { recorded, useScreen } from "../frame/screen";
import {
  accruals,
  collections,
  finance,
  heading,
  jeddah,
  laila,
  reminderTitle,
  reminders,
  runs,
  taskTitle,
  trends,
} from "./data";
import type { Run, Text } from "./data";
import "./month-end-close.css";

export function MonthEndClose() {
  return (
    <ScreenFrame slug="month-end-close">
      <Close />
    </ScreenFrame>
  );
}

// The step the agent asks about, and the step it hands on once that is decided.
const accrualsAt = 3;
const remindersAt = 4;

function Close() {
  const { language, t, number, percent, money, date, href, open, endSide } =
    useScreen();
  const text = (value: Text) => t(value.ar, value.en);
  const [suppliers, bank, entries, send, summary] = story.closeSteps;
  const uid = useId();

  // What the person decided at step 3, and whether the Jeddah question was
  // answered. Both are recorded after the host's moment, never before.
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);
  const [answered, setAnswered] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const task = useRef<HTMLDivElement>(null);
  // The answer being recorded, so closing the inbox can abort it.
  const answering = useRef<AbortController | null>(null);
  // The one hidden polite region: empty at mount, then one sentence per change.
  const [said, setSaid] = useState("");
  // Step 3 decided hands the reminders on: step 4 waits on the person, and its
  // three drafts reach the inbox.
  const handed = decision !== null;
  const drafts = number(reminders.length);

  // Records the decision after the host's moment. The task's status stays
  // «بانتظارك» through it, so no pattern speaks: the region says what changed,
  // once, and where focus goes. The decided card takes its focused button with
  // it, so the task takes focus, unless the person moved on while it recorded.
  // Closing the inbox aborts an answer still recording, so it records nothing,
  // whether or not the Sheet has unmounted yet: it holds on through its exit
  // animation, which can outlast the host's moment.
  function openInbox(next: boolean) {
    if (!next) answering.current?.abort();
    setInboxOpen(next);
  }

  async function decide(
    _request: unknown,
    chosen: ApprovalDecision,
    { signal }: { signal: AbortSignal },
  ) {
    await recorded(signal);
    const focused = task.current?.contains(document.activeElement);
    setDecision(chosen);
    setSaid(
      [
        chosen === "approved"
          ? t(
              `اكتملت الخطوة ${number(accrualsAt)}.`,
              `Step ${number(accrualsAt)} is done.`,
            )
          : t(
              `تُخطّيت الخطوة ${number(accrualsAt)}.`,
              `Step ${number(accrualsAt)} was skipped.`,
            ),
        t(
          `تنتظرك الخطوة ${number(remindersAt)}: ${drafts} مسودات في صندوق القرارات.`,
          `Step ${number(remindersAt)} needs you: ${drafts} drafts in the decision inbox.`,
        ),
        focused
          ? t("التركيز على مهمة الإقفال.", "Focus is on the close task.")
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  const states: AgentStep["state"][] = [
    "completed",
    "completed",
    decision === null
      ? "needs-you"
      : decision === "approved"
        ? "completed"
        : "skipped",
    handed ? "needs-you" : "pending",
    "pending",
  ];
  const details: ReactNode[] = [
    t(
      `${number(suppliers.invoices)} فاتورة · ${number(suppliers.differences)} فروقات`,
      `${number(suppliers.invoices)} invoices · ${number(suppliers.differences)} differences`,
    ),
    t(
      `${number(bank.accounts)} حسابات · ${number(bank.transactions)} حركة`,
      `${number(bank.accounts)} accounts · ${number(bank.transactions)} transactions`,
    ),
    t(
      `${number(entries.entries)} قيود · ${money(entries.amount)}`,
      `${number(entries.entries)} entries · ${money(entries.amount)}`,
    ),
    handed ? (
      <>
        {t(
          `${drafts} مسودات تنتظر مراجعتك`,
          `${drafts} drafts waiting for your review`,
        )}
        {" · "}
        <a href={href("invoices")}>{t("افتح الفواتير", "Open Invoices")}</a>
      </>
    ) : (
      t(
        `${number(send.customers)} عملاء`,
        `${number(send.customers)} customers`,
      )
    ),
    t(
      `ملف ${summary.format} من صفحة واحدة`,
      `A one-page ${summary.format} file`,
    ),
  ];
  const steps: AgentStep[] = story.closeSteps.map((step, index) => {
    const state = states[index];
    const run: Run | undefined = runs[step.id];
    return {
      id: step.id,
      title: step.title[language],
      detail: details[index],
      state,
      duration: state === "completed" ? run?.seconds : undefined,
      tools:
        state === "completed"
          ? run?.tools.map((tool) => ({
              label: text(tool.label),
              tool: tool.tool,
              state: "completed" as const,
              duration: `${number(tool.seconds)}${t("ث", "s")}`,
            }))
          : undefined,
      // The Finance agent hands the reminders to the Collections agent.
      ...(index === remindersAt - 1 ? { agent: collections[language] } : {}),
      ...(index === accrualsAt - 1
        ? {
            request: {
              id: accruals.id,
              action: text(accruals.action),
              target: story.sources[0].title[language],
              details: t(
                `الإجمالي ${money(entries.amount)}`,
                `${money(entries.amount)} in total`,
              ),
              consequences: [text(accruals.consequence)],
              approveLabel: text(accruals.approve),
              rejectLabel: text(accruals.reject),
            },
            // Reversible: an offsetting entry undoes the posting.
            approval: { reversible: true },
          }
        : {}),
    };
  });
  const waitingAt = steps.findIndex((step) => step.state === "needs-you") + 1;
  const operations = steps.reduce(
    (sum, step) =>
      sum + (step.state === "completed" ? (step.tools?.length ?? 0) : 0),
    0,
  );

  // The inbox opens with the Jeddah question; step 3 decided adds the drafts.
  const items: DecisionInboxItem[] = [
    {
      id: jeddah.id,
      title: text(jeddah.label),
      agent: { id: "finance", name: finance[language] },
      status: answered ? "completed" : "needs-you",
      time: answered
        ? undefined
        : t(
            `قبل ${number(jeddah.minutes)} د`,
            `${number(jeddah.minutes)} min ago`,
          ),
      questions: [
        {
          id: jeddah.id,
          label: text(jeddah.label),
          choices: jeddah.choices.map((choice) => ({
            value: choice.value,
            label: text(choice.label),
          })),
        },
      ],
      // A receipt says only that the answers were recorded.
      receipt: answered ? text(jeddah.receipt) : undefined,
    },
    ...(handed
      ? reminders.map((reminder): DecisionInboxItem => ({
          id: reminder.id,
          title: `${text(reminderTitle)} ${reminder.customer[language]}`,
          agent: { id: "collections", name: collections[language] },
          context: (
            <>
              <bdi dir="ltr">{reminder.invoice}</bdi> · {money(reminder.amount)}
            </>
          ),
          status: "needs-you",
          time: t("الآن", "just now"),
          draft: true,
        }))
      : []),
  ];
  const waiting = items.filter((item) => item.status === "needs-you").length;

  const rows: ChangeSummaryProps["rows"] = [
    {
      id: "cash-flow",
      metric: t("صافي التدفق النقدي", "Net cash flow"),
      change: t(
        `${percent(-story.cash.netFlowChange)} عن سبتمبر`,
        `${percent(-story.cash.netFlowChange)} below September`,
      ),
      direction: "down",
      tone: "bad",
      series: trends.cash,
    },
    {
      id: "dso",
      metric: t("متوسط فترة التحصيل", "Days to collect"),
      change: t(
        `من ${number(story.dso.from)} إلى ${number(story.dso.to)} يومًا`,
        `from ${number(story.dso.from)} to ${number(story.dso.to)} days`,
      ),
      direction: "up",
      tone: "bad",
      series: trends.dso,
    },
    {
      id: "overdue",
      metric: t("عدد الفواتير المتأخرة", "Overdue invoices"),
      change: t(
        `${number(story.overdue.invoices)} فاتورة · ${money(story.overdue.amount)}`,
        `${number(story.overdue.invoices)} invoices · ${money(story.overdue.amount)}`,
      ),
      direction: "up",
      tone: "bad",
      series: trends.overdue,
    },
  ];

  return (
    <>
      <ScreenHeader
        title={text(heading)}
        description={t(
          `تنتظرك الخطوة ${number(waitingAt)} من ${number(steps.length)}`,
          `Step ${number(waitingAt)} of ${number(steps.length)} is waiting for you`,
        )}
        actions={
          <Sheet
            open={inboxOpen}
            onOpenChange={openInbox}
            side={endSide}
            title={t("صندوق القرارات", "Decision inbox")}
            description={t(
              "ما ينتظر قرارك في إقفال أكتوبر.",
              "What waits for your decision in the October close.",
            )}
            closeLabel={t("إغلاق صندوق القرارات", "Close decision inbox")}
            trigger={
              <Button
                variant="ghost"
                className="month-end-close-inbox"
                aria-label={t(
                  `صندوق القرارات، بانتظارك: ${number(waiting)}`,
                  `Decision inbox, needs you: ${number(waiting)}`,
                )}
              >
                <Inbox size={17} aria-hidden="true" />
                {t("صندوق القرارات", "Decision inbox")}{" "}
                {/* The badge says what the name says, so the button's visible
                    text sits inside its name. */}
                <Badge tone={waiting > 0 ? "warning" : "neutral"}>
                  {t("بانتظارك: ", "Needs you: ")}
                  {number(waiting)}
                </Badge>
              </Button>
            }
          >
            <DecisionInbox
              items={items}
              // The Sheet already says «صندوق القرارات».
              title={t("طلبات الإقفال", "Close requests")}
              appearance="plain"
              headingLevel={3}
              onAnswer={async (_id, _answers, { signal }) => {
                // The pattern's own abort (it unmounts) ends it as well.
                const controller = new AbortController();
                answering.current = controller;
                signal.addEventListener("abort", () => controller.abort(), {
                  once: true,
                });
                try {
                  await recorded(controller.signal);
                  setAnswered(true);
                } finally {
                  if (answering.current === controller)
                    answering.current = null;
                }
              }}
              // A draft is reviewed where the invoices are. The answered
              // question has nowhere else to open, so its row closes the inbox
              // onto the task it belongs to.
              onOpen={(id) =>
                reminders.some((reminder) => reminder.id === id)
                  ? open("invoices")
                  : openInbox(false)
              }
            />
          </Sheet>
        }
      />
      <div className="month-end-close">
        <div className="month-end-close-main" ref={task}>
          <AgentTask
            title={text(taskTitle)}
            agent={finance[language]}
            status="needs-you"
            steps={steps}
            headingLevel={2}
            onDecision={decide}
          />
        </div>
        <Tray className="month-end-close-panel">
          <ChangeSummary
            status="ready"
            rows={rows}
            basedOn={`${t("الفترة: ", "Period: ")}${date(story.period.week.from)} – ${date(story.period.week.to)}`}
            headingLevel={2}
            appearance="plain"
          />
          <section
            className="month-end-close-facts"
            aria-labelledby={`${uid}-facts`}
          >
            <h2 id={`${uid}-facts`}>{t("تفاصيل التشغيل", "Run details")}</h2>
            <dl>
              <div>
                <dt>{t("الوكيل", "Agent")}</dt>
                <dd>{finance[language]}</dd>
              </div>
              <div>
                <dt>{t("بدأتها", "Started by")}</dt>
                <dd>{laila[language]}</dd>
              </div>
              <div>
                <dt>{t("استدعاءات الأدوات", "Tool calls")}</dt>
                <dd>{number(operations)}</dd>
              </div>
            </dl>
          </section>
        </Tray>
      </div>
      <span
        className="tz-visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {said}
      </span>
    </>
  );
}
